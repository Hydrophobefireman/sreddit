from flask import Flask, request, send_from_directory, Response
from urllib.parse import urlparse
import subprocess
from os import mkdir, path
from base64 import urlsafe_b64encode as enc
from json import dumps

app = Flask(__name__)
STATIC_FOLDER = "reddit-media"


def mkdir_reddit():
    try:
        mkdir(STATIC_FOLDER)
    except:
        pass


@app.route("/ping")
def pong():
    return "pong"


@app.route("/media/link/", strict_slashes=False)
def return_url():
    url = request.args["url"]
    if "reddit" not in urlparse(url).netloc.replace(".", ""):
        return {}
    fn = f"{enc(url.encode()).decode()}.mp4"
    file_path = path.join(STATIC_FOLDER, fn)

    return_dict = {
        "availableURLs": [
            {
                "type": "video/mp4",
                "src": f"//{urlparse(request.url).netloc}/reddit-media/{fn}",
            }
        ]
    }
    if path.isfile(file_path):
        return return_dict

    mkdir_reddit()
    args = ["youtube-dl", url, "-q", "-o", file_path]
    # print(args)
    subprocess.Popen(args).wait(timeout=None if "localhost" in request.url else 30)
    return return_dict


@app.route("/reddit-media/<file>")
def static_file(file):
    return send_from_directory(STATIC_FOLDER, file)


@app.after_request
def cors(resp):
    resp.headers["access-control-allow-origin"] = "*"
    return resp


def is_valid(url_host, path):
    if all(
        x not in url_host
        for x in ("v.redd.it", "i.redd.it", "redgifs.com", "gfycat.com", "imgur.com")
    ):
        return False
    if "imgur.com" in url_host and (
        path.startswith("/a/") or path.startswith("/gallery/")
    ):
        return False
    return True


if __name__ == "__main__":
    app.run(debug=True)
