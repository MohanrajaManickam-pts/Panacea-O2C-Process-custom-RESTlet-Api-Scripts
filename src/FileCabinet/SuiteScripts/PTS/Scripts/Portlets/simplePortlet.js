
/**
 * 
 * @NApiVersion 2.1
 * @NScriptType Portlet
 * @NModuleScope Public
 * @author sathish
 * @copyright 2025 [Prateek]**
 */

define([], function() {

    /**
     * Description placeholder
     *
     * @param {*} params
     *  @author sathish
     */
    function render(params) {
        params.portlet.title = "My Portlet"
        var content = "<td><span><b>Hello!!!</b></span></td>"
        params.portlet.html = content
    }

    return {
        render: render
    }
})