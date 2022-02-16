
# LabelIt

This is a fairly basic tool to label object detection datasets.
Despite running in a webbrowser, the app works entirely local.
Do note that things might break, it's not well-tested yet. Please let me know if you find issues or have suggestions for improvement.
There are no dependencies on `docker` or 42 circularily dependent python packages.
The only thing you need is a not completely-outdated webbrowser. Needless to say, Internet Explorer is not supported, but Edge should work fine.
The tool looks like this:

![labelit demo](./img/demo.gif)

You may:
- Customize what classes to use
- Upload an additional CSV file that displays accompanying classification data
- Import existing bounding boxes via MegaDetector or COCO file format

It supports:
- Copy the labels of the previous image (useful for image sequences with similar pics)
- Filter bounding boxes according to their confidences
- Mark images as unseen/needs review/seen (preserved when re-importing a previously generated COCO export)
- Extensive use of hotkeys
- Moving and Zooming on the image
- Export to COCO file format
- Fuzzy search class names (useful for big number of classes)
- Priority sorting class names according to their frequency in the dataset (useful for big number of classes)
- Attributes

Limitations:
- Everything is local. If you want to label images from some cloud, you'll probably have to download them
- Attributes are fixed to sex (female/undefined/male) and age (juvenile/unknown/adult)

## Setup

In order to use it, you need any kind of webserver to serve the files.
For convenience, the tool ships with a server, which you may inspect in `serve.py`.
It depends on the `aiohttp` python module, which may be installed using `conda` or `pip`.
Start the server:
```sh
python -m aiohttp.web -H localhost -P 8080 serve:init_func
```
Now open [localhost:8080/index.html](localhost:8080/index.html) and you're good to go.
If you explicitly turnoff JavaScript when surfing the internet, please make sure to turn it on for this webpage.

