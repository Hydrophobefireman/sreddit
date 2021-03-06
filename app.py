from flask import Flask, request, send_from_directory, Response
from urllib.parse import urlparse
import subprocess
from os import mkdir, path, rename, remove
from base64 import urlsafe_b64encode as enc
from json import dumps
from time import time, sleep

app = Flask(__name__)
STATIC_FOLDER = "reddit-media"


def mkdir_reddit():
    try:
        mkdir(STATIC_FOLDER)
    except:
        pass


def remv(f):
    try:
        remove(f)
    except:
        pass


@app.route("/ping")
def pong():
    return "pong"


def dict2bytes(d):
    return dumps(d).encode()


def get_return_dict(u, fn):
    return dict2bytes(
        {
            "source": [
                {
                    "type": "video/mp4",
                    "src": f"//{urlparse(u).netloc}/reddit-media/{fn}",
                }
            ]
        }
    )


def generate_response(url, request_url):
    fn = f"{enc(url.encode()).decode()}.mp4"
    file_path = path.join(STATIC_FOLDER, fn)
    return_dict = get_return_dict(request_url, fn)
    if path.isfile(file_path):
        yield return_dict

    else:
        mkdir_reddit()
        unoptimized_name = path.join(STATIC_FOLDER, f"___unoptimized___{fn}")
        args = ["youtube-dl", url, "-q", "-o", unoptimized_name]
        # print(args)
        proc = subprocess.Popen(args)

        while True:
            x = proc.poll()
            if x is None:
                yield b" "
                sleep(0.2)
            else:
                break
        if x != 0:
            yield dict2bytes({"error": "Could not download"})
            return
        proc = subprocess.Popen(
            [
                "ffmpeg",
                "-i",
                unoptimized_name,
                "-movflags",
                "faststart",
                "-vcodec",
                "copy",
                "-acodec",
                "copy",
                file_path,
            ]
        )

        while True:
            x = proc.poll()
            if x is None:
                yield b" "
                sleep(0.2)
            else:
                break
        try:
            remove(unoptimized_name)
        except:
            pass
        if x != 0:
            yield dict2bytes({"error": "Could not optimize"})
        else:
            yield return_dict


@app.route("/media/link/", strict_slashes=False)
def return_url():
    url = request.args["url"]
    if "reddit" not in urlparse(url).netloc.replace(".", ""):
        return {}

    return Response(
        generate_response(url, request.url), content_type="application/json"
    )


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
