const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const {generatePDFPreview} = require('./controllers')

const configureMiddlewares = app => {
    // body parsing
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())

    // cors handling and some allowed headers
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE")
        res.header(
            "Access-Control-Allow-Headers",
            "access-control-allow-origin, accept, content-type, Authorization, hmscpa"
        )
        next()
    })

}

const configureGeneralErrorHandler = app => {
        // general purposes exception catcher middleware
        // eslint-disable-next-line no-unused-vars
        app.use((err, req, res, next) => {
            if (res.headersSent) {
                return next(err)
            }
            res.status(err.status || 500)

            // development error handler - will print stacktrace
            // production error handler - no stacktraces leaked to user
            const errData = err

            res.format({
                text: function() {
                    res.send(err.message)
                },
                json: function() {
                    res.json({
                        message: err.message,
                        error: errData,
                        info: err.info
                    })
                }
            })
        })    
}

const routes = app => {
    app.post('/previews', generatePDFPreview)

    app.use(express.static(path.join(__dirname, '../website')))    
}


const configure = async app => { //it's not, i know, but template code waits on promise...
    configureMiddlewares(app)
    routes(app)
    configureGeneralErrorHandler(app)
}


module.exports = {
    configure
}