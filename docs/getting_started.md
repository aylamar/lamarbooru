# Setting up Lamarbooru

Currently, the only way to run Lamarbooru is to clone the repo, install everything with `npm i`, then run `npm run start`.

Eventually, the goal is to provide a docker image for easy setup/installation.

## Required Environment Variables

* `PORT`: Port to run the webserver.
* `DATABASE_URL`: Postgres connection string.
* `VITE_BASE_URL`: Base URL for webserver, should be `https://localhost:3000/` for development. `/` can be used as well.
* `FILES_DIRECTORY`: Location on disk to store uploaded files. 
* `THUMBNAILS_DIRECTORY`: Location on disk to store generated thumbnails.


### Example .env file

```
PORT=3000
DATABASE_URL="postgresql://postgres:very_secure_password_that_you_should_probably_change@localhost:5432/postgres?schema=postgres"
VITE_BASE_URL=http://localhost:3000/
FILES_DIRECTORY="/Lamarbooru/files"
THUMBNAILS_DIRECTORY="/Lamarbooru/thumbnails"
```

## Setup Process

1. Clone the repo.
2. Navigate to the directory that the repo was closed to.
3. Run `npm i` to install dependencies.
4. Install Postgres (this can be done with the `docker-compose up` command if Docker is installed on your machine).
5. Create a file named `.env` with the contents listed above under `Required Environment Variables`.*
6. Run `prisma db push` to create the required tables.
7. Run `npm run start` to start Lamarbooru.
8. Navigate to the url that is printed into the console using a web browser of your choice to access the webserver.

Note: If you opt to use the `docker-compose up` command for setting up Postgres, you can copy the example `.env` file.
