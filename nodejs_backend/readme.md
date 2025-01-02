# NodeJS Backend for CampusVibe Application

This is the first I am building. It will take some time.
Readme.md will also be updated as the work goes on.

Each request will return a Status Code [HTTP Code] and a Message [describing the response/request]

## /login [POST] (400, 401, 200, 500)

Provides an accessCode by which user can interact with the application

- Body
- - { username, password }
- Response
- - { token }
- - Cookie[token]

## /login/new [POST] (400, 409, 201, 500)

Creates a user and sends a verification email in response

- Body
- - { username, password, email }
- Response
- - Verification email with a Otp

## /login/email [POST] (400, 200, 500)

Verifies the user's email

- Body
- - { username, otp } [OTP will be in the verification email]
- Response
- - null

## /login/email/resend [GET] (400, 200, 500)

Makes the previous verification links invalid and sends a new one

- Query
- - { username }
- Response
- - Verification email with a Otp

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

## /friends [GET] (200, 500)

Gets all the friends (where request accepted)

- Query
- - { offset }
- Response
- - { friends, offsetNext }

## /friends [DELETE] (204, 500)

Unfriend the user

- Query
- - { friendId }
- Response
- - null

## /friends/request [GET] (400, 200, 500)

Gets all the requests depending on the query

- Query
- - { offset, sent, [recieved, accepted, rejected] }
- Response
- - { requests, offsetNext }

## /friends/request/all [GET] (200, 500)

Gets all the requests where accepted request will not be available

- Query
- - { offset }
- Response
- - { requests, offsetNext }

## /friends/request [POST] (400, 201, 500)

Sends a request to the specified user

- Body
- - { friendId }
- Response
- - null

## /friends/request/accept [POST] (200, 500)

Accepts a friend request

- Body
- - { friendId }
- Response
- - null

## /friends/request/reject [POST] (200, 500)

Rejects a friend request

- Body
- - { friendId }
- Response
- - null

## /friends/request [DELETE] (204, 500)

Deletes a friend request

- Query
- - { friendId }
- Response
- - null
