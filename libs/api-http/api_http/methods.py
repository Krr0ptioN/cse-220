
from route import route


def get(route_path: str = ""):
    "GET route decorator for controller methods."
    return route("GET", route_path)


def post(route_path: str = ""):
    "POST route decorator for controller methods."
    return route("POST", route_path)


def put(route_path: str = ""):
    "PUT route decorator for controller methods."
    return route("PUT", route_path)


def patch(route_path: str = ""):
    "PATCH route decorator for controller methods."
    return route("PATCH", route_path)


def delete(route_path: str = ""):
    "DELETE route decorator for controller methods."
    return route("DELETE", route_path)

