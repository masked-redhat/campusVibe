# NodeJS Backend for CampusVibe Application

This is the first I am building. It will take some time.
Readme.md will also be updated as the work goes on.

Each request will return a Status Code [HTTP Code] and a Message [describing the response/request]

## /login [POST] (400, 401, 200, 500)

Provides an accessCode by which user can interact with the application

- Body
- - { username, password }
- Response
- - { accessCode }
- - Cookie[refreshCode]

## /login/new [POST] (400, 409, 201, 500)

Creates a user and sends a verification email in response

- Body
- - { username, password, email }
- Response
- - Verification email with a verification link

## /login/email [GET] (400, 200, 500)

Verifies the user's email

- Query
- - { username, token } [Both will be inside the verification link]
- Response
- - null

## /login/email/resend [GET] (400, 200, 500)

Makes the previous verification links invalid and sends a new one

- Query
- - { username }
- Response
- - Verification email with a verification link

## /logout [GET] (200, 500)

Logs out the user. The tokens will become invalid

- Query
- - null
- Response
- - null

## /posts [GET] (200, 500)

Sends a response containing posts of the concerning user

- Query
- - { offset }
- Response
- - { posts, offsetNext }

## /posts [POST] (400, 500, 201)

User can now post

- Body
- - { title, content, reposts, images }
- Response
- - { postId }

## /posts [PATCH] (400, 500, 200)

Will update only provided values

- Body
- - { [title, content, reposts, images], postId }
- Response
- - null

## /posts [PUT] (400, 500, 200)

Will update all values

- Body
- - { title, content, reposts, images, postId }
- Response
- - null

## /posts [DELETE] (400, 500, 204)

Deletes the requested post

- Query
- - { postId }
- Response
- - null

## /posts/like [GET] (404, 500, 200)

Gives the like activity on a post

- Query
- - { postId, offset }
- Response
- - { likes, offsetNext }

## /posts/like [POST] (409, 404, 500, 200)

Likes the post

- Body
- - { postId }
- Response
- - null

## /posts/like [DELETE] (400, 500, 200)

Unlikes the post

- Query
- - { postId }
- Response
- - null

## /posts/comment [GET] (400, 500, 200)

Gives the comments on a specific post/posts

- Query
- - { postId/[], offset, filter["LATEST"(default),"HIGHEST_VOTE"] }
- Response
- - { comments, offsetNext }

## /posts/comment [POST] (400, 500, 201)

Comments on a post

- Body
- - { postId, comment, commentId[neccessary_if_replying], images }
- Response
- - null

## /posts/comment [PATCH] (400, 500, 200)

Patches a comment, only updates provided values

- Body
- - { [comment, images], commentId }
- Response
- - null

## /posts/comment [PUT] (400, 500, 200)

Patches a comment, only updates provided values

- Body
- - { comment, images, commentId }
- Response
- - null

## /posts/comment [DELETE] (500, 400, 204)

Deletes the comment and its corresponding replies

- Query
- - { commentId }
- Response
- - null

## /posts/comment/reply [GET] (400, 200, 500)

Get the replies of a comment

- Query
- - { commentId, offset }
- Response
- - { replies, offsetNext }

## /posts/comment/vote [GET] (200, 500)

Get the vote activity on a comment

- Query
- - { commentId, offset }
- Response
- - { vote, offsetNext }

## /posts/comment/vote [POST] (400, 200, 500)

Create/update vote given by user on a comment

- Body
- - { commentId, voteVal[-1,0,1] }
- Response
- - null
