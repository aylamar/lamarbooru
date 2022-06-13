# Setting up Lamarbooru

## Building from source

### Required Environment Variables

* `PORT`: Port to run the webserver.
* `DATABASE_URL`: Postgres connection string.
* `VITE_BASE_URL`: Base URL for webserver, should be `https://localhost:3000/` for development. `/` can be used as well.
* `FILES_DIRECTORY`: Location on disk to store uploaded files. 
* `THUMBNAILS_DIRECTORY`: Location on disk to store generated thumbnails.
* `DELETE_MISPLACED_FILES`: Should be `true` or `false`. If `true`, any files in the two above directories that are not in the database and are named with a valid UUID will be deleted during weekly maintenance.

#### Example .env file

```
PORT=3000
DATABASE_URL="postgresql://postgres:very_secure_password_that_you_should_probably_change@localhost:5432/postgres?schema=postgres"
VITE_BASE_URL=http://localhost:3000/
FILES_DIRECTORY="/Lamarbooru/files"
THUMBNAILS_DIRECTORY="/Lamarbooru/thumbnails"
DELETE_MISPLACED_FILES=true
```

### Setup Process

1. Clone the repo.
2. Navigate to the directory that the repo was closed to.
3. Run `npm i` to install dependencies.
4. Install Postgres (this can be done with the `docker-compose up` command if Docker is installed on your machine).
5. Create a file named `.env` with the contents listed above under `Required Environment Variables`.*
6. Run `prisma db push` to create the required tables.
7. Run `npm run start` to start Lamarbooru.
8. Navigate to the url that is printed into the console using a web browser of your choice to access the webserver.

Note: If you opt to use the `docker-compose up` command for setting up Postgres, you can copy the example `.env` file.

## Docker

1. [Install Docker](https://www.docker.com/). If you're on Windows or Mac, you can use the [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Download zip of the repository.
3. Extract the zip to a location on your computer.
4. Create a file named `.env` in the root of the folder that was extracted.
5. In the file, add the following lines:
```dotenv
FILES_DIRECTORY="C:/path/to/store/files"
THUMBNAILS_DIRECTORY="C:/path/to/store/thumbnails"
DELETE_MISPLACED_FILES=true
```
6. Run the following command:
```bash
docker-compose up
```
7. Once everything is running, you can visit `http://localhost:6969` in your browser to access the client.
