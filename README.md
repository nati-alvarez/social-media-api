# Comlplainr API

This is the API for a social media platform I'm working on called complainr

## API Routes

`/api/users/`

GET(requires auth) - Query Params(username):
Returns a list of all users or all users matching an optional url query param

POST - Req Body(username, email, password):
Creates a new user with username, email, and password info. Image is given a default value.



`/api/users/login`

POST - Req Body(username, password):
Finds user with matching credentials. If user is found, return user and set cookie with API token.



`/api/users/logout`

GET(requires auth): 
Logs out user. Deletes cookie with api token.


`/api/users/:username`

GET(requires auth):
Get information about a particular user matching username in url param

PUT(requires auth) - Req Body(email, image, bio):
Update a users information and return updated user info. All fields are optional.

DELETE(requires auth):
Deletes user account



`/api/posts`

GET:
Returns all posts

POST(requires auth) - Req Body(postBody):
Creates a new post. Post body is taken by user input. Post author is taken from cookie.
Likes, Dislikes, Favorites are set to 0.



`/api/posts/:postid`

GET:
Returns post and post's comments with specified id

POST(requires auth) - Req Body(commentBody):
Creates a new comment.

DELETE(requries auth):
Deletes post and post's comments with specified id if authorized



`/:postid/favorite`

POST:
Adds current article to favorites

