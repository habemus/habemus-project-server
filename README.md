# H-Project

The h-project api is responsible for:
  - managing projects
  - managing project identity
  - project permissions
  - project versioning
  - version source files storage
  - version building process
  - version built files storage

## Project

A `project` is the entity that defines a logical space for a user to work with code
and deploy that code to a hosted website.

The `project` is the unit that will identify resources throughout APIs.
Its `_id` attribute is immutable and can be safely stored by other APIs that may eventually
require access to the project's information.
The project's _id attribute should not be exposed in the visible user interface in any way.

Its `code` attribute is a public identifier that IS NOT immutable. The code is a human-and-machine-friendly string used to refer to the project in interactions that a human might need
to remember it.

A `project` may have multiple `projectVersions`, which is comparable to commits
of a git repository. Further in that comparison, it should be noted that in the future
we might want to allow users to `fork` from one another's project.

A `project` consists of
  - (_id) unique private and immutable identifier of the project
  - (code) unique public and mutable identifier of the project

## ProjectVersion

A `projectVersion` is a snapshot of the project at a specific time.
It is immutable, which means that once a version is created it cannot be modified by the
user and it MUST be permanently available for the user to access. All accesses to a given
version MUST return the exact same results.

A `projectVersion` consists of
  - (code) a unique version identifier: a immutable human AND machine friendly string that may
    be used throughout applications, including public domain names and urls.
  - (srcStorage) information regarding the location of the zipped source files of the version
  - (distStorage) information regarding the location of the zipped built files of the version

## Project permissions

The project is the centerpiece of permission management. A project MUST have at least 1 user
which is allowed to perform ALL actions on it.

Once a user is given, say, `read` permissions to the project, it automatically is granted
`read` permissions on all `projectVersions` and other immediately subjacent resources. 

Any APIs that work with resources without internal permissions definition may use the project
permissions in order to check whether a user is granted (or not) access.

# Contributing

As with any other server side habemus module, this is a microservice and should be
developed in isolation from other microservices. All development process should be
independent from other modules and all tests should use mocks intensively.

The environment variables that need to be set to run the tests are:
- TEST_GCP_KEY_FILENAME:
  path to the key filename of GCP that has enough permissions for writing and updating
  objects in GCS (Google Cloud Storage)
- TEST_GCP_PROJECT_ID
  id of the GCP project used for tests
- TEST_GCP_BUCKET
  name of the bucket to be used for tests

After setting these environment variables, run `gulp test` to check that all tests pass
prior to any development.

In case any tests fail, those tests MUST be verified prior to development start.

Test coverage is calculated only for controllers and models.
These should remain ideally around 80%. 70% minimum.
