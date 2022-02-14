import aiohttp.web as web

# This should NOT be exposed to the world wide web!
# This serves as entry-point. We could make POST requests from JS client side
# asking for our smart AI thing to do a prediction for us.

def init_func(argv):
    app = web.Application()
    app.add_routes([web.static('/', '.')])
    return app
