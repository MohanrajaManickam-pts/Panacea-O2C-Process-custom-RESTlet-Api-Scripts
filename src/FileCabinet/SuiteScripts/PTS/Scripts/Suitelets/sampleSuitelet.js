

/**
 * 
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @author sathish
 * @copyright 2025 [Prateek]**
 */

define([], function() {


    /**
     * Description placeholder
     *
     * @param {*} context
     *  @author sathish
     * @returns {}
     */
    function onRequest(context) {
        var html = "<html><body><h1>Hello World</h1></body></html>"
        context.response.write(html)
        context.response.setHeader({
            name: "Custom-Header-Demo",
            value: "Demo"
        })
    }

    return {
        onRequest: onRequest
    }
})