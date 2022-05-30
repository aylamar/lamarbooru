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
* `creator`: (optional) The creator of the file.
* `rating`: (optional) The rating of the file (must be safe, questionable, or explicit).
* `tags`:  (optional) String containing tags seperated by spaces.

```json title="Example request body"
{
    "creator": "yom",
    "tags": "meta:absurdres 1girl",
    "source": "https://www.example.com/image.jpeg",
    "rating": "safe",
}
```

```json title="Successful Reponse (201)"
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
        },
        {
            "id": 2,
            "tag": "absurdres",
            "namespace": "meta",
        },
        {
            "id": 6,
            "tag": "yom",
            "namespace": "creator"
        }
    ]
}
```
Unsuccessful response codes:

* 400: Missing required fields or invalid file type.
* 303: File already exists.

```json title="Unsuccessful Response (303)"
{
    "error": "File already exists",
    file: {
        ...file data of matching file...
    }
}
```

### PUT `/api/file/:id`

_Update the data on the file._

Parameters:

* `id`: The numerical ID of the file to update.

Arguments:

* `tags`:  (required) String containing tags seperated by spaces.
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
    "filename": "c3bb72a9-4cbe-4872-b7b2-bf9e27bfa3e8.jpeg",
    "createdAt": "2022-05-30T15:52:35.297Z",
    "updatedAt": "2022-05-30T15:52:35.298Z",
    "source": [
        "https://www.example.com/example.jpg"
    ],
    "approved": false,
    "rating": "safe",
    "tags": [
        {
            "id": 4,
            "tag": "absurdres",
            "namespace": "meta",
            "_count": {
                "files": 1
            }
        },
        {
            "id": 5,
            "tag": "1girl",
            "namespace": "tag",
            "_count": {
                "files": 1
            }
        },
        {
            "id": 7,
            "tag": "yomu",
            "namespace": "creator",
            "_count": {
                "files": 1
            }
        },
        {
            "id": 8,
            "tag": "1boy",
            "namespace": "tag",
            "_count": {
                "files": 1
            }
        }
    ]
}
```

Unsuccessful response codes:

* 400: Missing required fields or invalid field data.
* 404: No file found with that id.
* 500: Database error while updating file.
