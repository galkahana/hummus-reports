class ExternalsMap {
    constructor(externalsMap) {
        this.externalsMap = externalsMap
    }

    getExternalPath(external) {
        if (typeof external == 'string') {
            external = {
                name: external,
                origin: 'external',
            }
        }

        if (!external) return null

        return this.externalsMap[external.name]
    }    
}

module.exports = ExternalsMap