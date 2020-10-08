const express = require('express'),
    setup = require('./lib/setup'),
    terminator = require('./lib/terminator')

// Setup exit process termination (so wont keep the @#$@#$ port)
terminator.setup()

// Ze app
const app = express()

// Load config (middlewares, settings, routes, db etc.) and start the server
setup.configure(app).then(() => {
        // Yalla, let's get this party started!
        app.set("port",  process.env.PORT || 5000)
        const server = app.listen(app.get("port"), function(err) {
            if (err) {
                console.error(`Express server failed to listen on port ${server.address().port}`)
            } else {
                console.info(`Express server listening on port ${server.address().port}`)
            }
        })
    })
    .catch(ex => {
        console.error(`Server Setup error ${ex}`)
    })
