


The tool is a simple webapp which loads the files *locally*.
In order to use it, you need any kind of webserver to serve the files.
For convenience, the tool ships with a server, which you may inspect in `serve.py`.
To run it, do:
```sh
python -m aiohttp.web -H localhost -P 8080 serve:init_func
```
Then open your favorite webbrowser and open the website `localhost:8080`.

