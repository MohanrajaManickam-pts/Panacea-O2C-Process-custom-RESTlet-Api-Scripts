
/**
 * 
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @author sathish
 * @copyright 2025 [Prateek]**
 */
 define(["N/log"], function(log) {
  
   
  /**
   * Description placeholder
   *
   * @param {Objects} context
   * @author sathish
   */
    function beforeLoad(context) {
        try {
            var rec = context.newRecord

            var memo = rec.getValue("MEMO")
            log.debug("memo----->", memo)

           rec.setValue({
                fieldId : "custbody_memo_2",                  
                value : memo
            })
            
        } catch (error) {
            log.error("Error in before load-------->", error)
        }
    }

    return {
        beforeLoad: beforeLoad,
      
    }
})
