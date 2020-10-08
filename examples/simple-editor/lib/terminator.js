// safe and sure kill
// first create a generic "terminator"
const terminator = function(sig) {
    if (typeof sig === "string") {
        console.info(
            "%s: Received %s - terminating app ...",
            Date(Date.now()),
            sig
        )
        process.exit(1)
    }
    console.info("%s: Node server stopped.", Date(Date.now()))
}

module.exports = {
    // then implement it for every process signal related to exit/quit
    setup: function() {
        [
            "SIGHUP",
            "SIGINT",
            "SIGQUIT",
            "SIGILL",
            "SIGTRAP",
            "SIGABRT",
            "SIGBUS",
            "SIGFPE",
            "SIGUSR1",
            "SIGSEGV",
            "SIGUSR2",
            "SIGTERM"
        ].forEach(function(element) {
            process.on(element, function() {
                terminator(element)
            })
        })
    }
}
