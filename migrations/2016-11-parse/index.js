// native
const fs = require('fs');
const path = require('path');

// third-party
const Bluebird = require('bluebird');
const log      = require('awesome-logs');

const projects = require('./projects');

const CONSTANTS = require('../../shared/constants');

const ZIP_RE = /\.zip$/;

function _wait(ms) {
  return new Bluebird((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

function _trimZip(str) {
  return str ? str.replace(ZIP_RE, '') : false;
}

/**
 * Imports all versions defined in the given
 * sourceProjectData
 */
function _importProjectVersions(hProject, project, sourceGCSBucket, sourceProjectData) {

  log.info('started importing projectVersions', sourceProjectData.name);

  var importedVersions = [];

  return sourceProjectData.versions.reduce((lastPromise, sourceVersionData, index) => {


    var isLatest = (sourceProjectData.versions.length - 1 === index);

    return lastPromise.then(() => {

      log.info('[version-start] started importing version ' + sourceProjectData.name + ':' + sourceVersionData.name);

      var sourceFile = sourceGCSBucket.file(sourceVersionData.gcpStorage.name, {
        generation: parseInt(sourceVersionData.gcpStorage.generation),
      });

      var sourceFileReadStream = sourceFile.createReadStream();

      /**
       * Create the project version
       */
      return hProject.controllers.projectVersion.create(
        project,
        sourceFileReadStream
      );
    })
    .then((version) => {

      /**
       * Schedule only the LATEST version's build
       */
      if (isLatest) {
        return hProject.controllers.projectVersion.scheduleBuild(version);
      } else {
        return version;
      }
    })
    .then((version) => {
      importedVersions.push(version);
      log.info('[version-ok] version successfully imported: ' + sourceProjectData.name + ' ' + version.code);
    })
    .catch((err) => {
      log.error('[version-error] failed to import project version', err, err.stack);
    });

  }, Bluebird.resolve())
  .then(() => {
    return importedVersions;
  });

}

exports.migrate = function (options) {

  if (!options.hProject) {
    throw new Error('hProject is required');
  }

  if (!options.hAccount) {
    throw new Error('hAccount is required');
  }

  if (!options.sourceGcpProjectId) {
    throw new Error('sourceGcpProjectId is required');
  }

  if (!options.sourceGcpKeyFilename) {
    throw new Error('sourceGcpKeyFilename is required');
  }

  if (!options.sourceGcpBucket) {
    throw new Error('sourceGcpBucket is required');
  }

  const hProject = options.hProject;
  const hAccount = options.hAccount; 

  /**
   * Setup the source bucket where the source project files are stored
   */
  const sourceGCSBucket = require('google-cloud').storage({
    projectId: options.sourceGcpProjectId,
    keyFilename: options.sourceGcpKeyFilename,
  })
  .bucket(options.sourceGcpBucket);

  var targetImportedProjectsCount = projects.length;

  var allSkippedProjects  = [];
  var allImportedProjects = [];
  var allImportedVersions = [];

  return Bluebird.all([hProject.ready, hAccount.ready]).then(() => {

    const Project = hProject.services.mongoose.models.Project;
    const Account = hAccount.services.mongoose.models.Account;

    return projects.reduce((lastPromise, sourceProjectData) => {
      
      return lastPromise.then(() => {

        log.row();
        log.info('[project-start] started importing project ' + sourceProjectData.name);

        // map out owners
        return Bluebird.all(sourceProjectData.owners.map((ownerId) => {
          return Account.findOne({
            'meta.parseObjectId': ownerId,
          });
        }));
      })
      .then((ownerAccounts) => {

        /**
         * Check if the owner accounts correspond to existing accounts
         */
        var ownerAccountIds = ownerAccounts.map((account) => {
          if (!account) {
            return false;
          } else {
            return account._id.toString();
          }
        });

        /**
         * Flag that indicates whether it was possible
         * to find the owner account related to the project
         */
        var notFoundSomeAccount = ownerAccountIds.some((id) => {
          return id === false;
        });

        if (notFoundSomeAccount) {
          log.alert('[skip] Missing owner accounts ' + sourceProjectData.name);
          allSkippedProjects.push({
            reason: 'MissingOwnerAccounts',
            project: sourceProjectData,
          });
          return false;
        }

        /**
         * Check if there are versions to be imported
         * for the project
         *
         * If the project has no versions, skip it
         */
        if (!sourceProjectData.versions || sourceProjectData.versions.length === 0) {
          log.alert('skipping project ' + sourceProjectData.name + ': it has no versions');
          // log.info(sourceProjectData);
          
          allSkippedProjects.push({
            reason: 'NoVersions',
            project: sourceProjectData,
          });
          return false;
        }

        /**
         * Everything ok!
         */

        var _id = _trimZip(sourceProjectData.storageId);

        // create a new project
        var project = new Project({
          _id: _id,
          code: sourceProjectData.safeName,
          name: sourceProjectData.name,
          createdAt: sourceProjectData._created_at.$date,
          updatedAt: sourceProjectData._updated_at.$date,
          meta: {
            parseObjectId: sourceProjectData.objectId,
          },
        });

        /**
         * Grant the owner all valid permissions
         */
        ownerAccountIds.forEach((accountId) => {
          project.grant(
            accountId,
            CONSTANTS.VALID_PROJECT_PERMISSIONS
          );
        });

        project.setStatus(
          CONSTANTS.PROJECT_STATUSES.ACTIVE,
          'MigratedFromParse'
        );

        return project.save()
          .then((project) => {

            /**
             * Import versions
             */
            return _importProjectVersions(
              hProject,
              project,
              sourceGCSBucket,
              sourceProjectData
            )
          })
          .then((importedVersions) => {
            allImportedVersions = allImportedVersions.concat(importedVersions);

            return project;
          });
      })
      .then((importedProject) => {

        if (importedProject) {
          allImportedProjects.push(importedProject);
          log.info('[project-ok] imported project ' + sourceProjectData.name);
          log.row();

        } else {
          log.alert('[project-skip] skipped project ' + sourceProjectData.name);
          log.row();
        }
      });

    }, Bluebird.resolve())
    .then(() => {

      if (targetImportedProjectsCount !== allImportedProjects.length + allSkippedProjects.length) {
        throw new Error('targetImportedProjectsCount not achieved');
      }

      if (allSkippedProjects.length > 0) {
        console.log('skipped projects', JSON.stringify(allSkippedProjects, null, '  '));
      }

      return {
        importedProjects: allImportedProjects,
        importedVersions: allImportedVersions,
        skippedProjects: allSkippedProjects,
      };

    });

  });

};

exports.undo = function (hProject) {

};
