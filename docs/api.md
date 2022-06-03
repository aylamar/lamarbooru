# API Routes

## File Routes

### GET `/api/file/:id`

_Get file by id._

Parameters:

* `id`: The numerical ID of the file to fetch.

```json title="Successful Reponse (200)"
{
    "id": 1,
    "filename": "c3bb72a9-4cbe-4872-b7b2-bf9e27bfa3e8.jpeg",
    "createdAt": "2022-05-30T15:52:35.297Z",
    "updatedAt": "2022-05-30T15:52:35.298Z",
    "source": ["https://www.example.com/image.jpeg"],
    "approved": true,
    "rating": "safe",
    "tags": [
        {
            "id": 1,
            "tag": "1girl",
            "namespace": "tag",
            "_count": {
                "files": 5
            }
        },
        {
            "id": 2,
            "tag": "absurdres",
            "namespace": "meta",
            "_count": {
                "files": 4
            }
        }
    ]
}
```

Unsuccessful response codes:

* 404: File not found.

### POST `/api/file`

_Add a new file to the database._

Arguments:

* `file`: (required) The file to upload.
* `tags`:  (required) Array of strings containing tags.
* `rating`: (optional) The rating of the file (must be safe, questionable, or explicit).

```json title="Example request body"
{
    "tags": ['meta:absurdres', '1girl', 'creator:yom'],
    "source": "https://www.example.com/image.jpeg",
    "rating": "safe",
}
```

```json title="Successful Reponse (201)"
{
    "id": 1,
    ... full file data ...
}
```

Unsuccessful response codes:

* 400: Missing required fields or invalid file type.
* 303: File already exists.

```json title="Unsuccessful Response (303)"
{
    "error": "File already exists",
    file: {
        ... file data of matching file ...
    }
}
```

### PUT `/api/file/:id`

_Update the data on the file._

Parameters:

* `id`: The numerical ID of the file to update.

Arguments:

* `tags`:  (required) Array of strings containing tags.
* `rating`: (optional) The rating of the file (must be safe, questionable, or explicit).
* `source`: (optional) The source url of the file.

```json title="Example request body"
{
    "tags": [
        "creator:yomu",
        "meta:absurdres",
        "1girl",
        "1boy"
    ],
    "source": [
        "https://www.example.com/example.jpg"
    ],
    "rating": "safe" 
}
```

```json title="Successful Reponse (200)"
{
    "id": 1,
    ... full file data with changes ...
    ]
}
```

Unsuccessful response codes:

* 400: Missing required fields or invalid field data.
* 404: No file found with that id.
* 500: Database error while updating file.

### GET `/api/file/search/:page`

_Get a page of 32 files using, optionally filtered by tag_

Parameters:

* `page`: (required) The page number, must one or greater.
* `tags`: (optional) The tag to filter by, any number of tags are supported and should be seperated by a space of a "+".

```json title="Successful Reponse (200)"
[
    {
        "id": 5,
        ... full file data ...
     },
     {
        "id": 4,
        ... full file data ...
     },
     ... etc ...
]
```

Unsuccessful response codes:

* 400: Missing required fields or invalid field data.
* 404: No files found with the parameters provided.
