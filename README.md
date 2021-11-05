# blender-render-request-service
The absolute bare bone basic blender render request service!

To start, 
- have blender available on the PATH
- run `npm install`
- run `npm start` 
- go to localhost:8899


Upload a blender file and click submit:
![image](https://user-images.githubusercontent.com/1131494/140438691-e3225075-7c9c-4037-856a-dde150715121.png)

When it's done rendering, it will delete the blend file on the server, and show an image (this only renders the first frame, and only works with PNG).
![image](https://user-images.githubusercontent.com/1131494/140438833-5b2f6006-5ba2-4123-9916-bc0270ec3458.png)

After previewing or saving, you can delete the image from the server by clicking the "Delete image from server" button.
