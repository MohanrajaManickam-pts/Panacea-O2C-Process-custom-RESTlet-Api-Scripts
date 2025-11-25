/**
 * 
 * @NApiVersion 2.1
 * @NScriptType ClientScripts
 * @NModuleScope Public
 * @author sathish
 * @copyright 2025 [Prateek]**
 */
define([], function() {

    /**
     * Description placeholder
     *
     * @param {*} context
     * @author sathish
     */
    function pageInit(context) {
        try {
            var rec = context.currentRecord
            console.log("rec",rec)
        } catch (error) {
            console.error("Error in pageInit",error)
        }
    }

   

    return {
        pageInit: pageInit,
      
    }
})
