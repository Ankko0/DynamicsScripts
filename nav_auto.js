var Navicon = Navicon || {};

Navicon.nav_auto = (function () {

    function UsedOnChange (context) {
        let formContext = context.getFormContext();
        let isUsed = formContext.getAttribute('nav_used').getValue();
        if (isUsed) {
            formContext.getControl('nav_km').setVisible(true);
            formContext.getControl('nav_ownerscount').setVisible(true);
            formContext.getControl('nav_isdamaged').setVisible(true);
        } else {
            formContext.getControl('nav_km').setVisible(false);
            formContext.getControl('nav_ownerscount').setVisible(false);
            formContext.getControl('nav_isdamaged').setVisible(false);
        }
    }

    return {
        OnLoad: function (context) {
            let formContext = context.getFormContext();
            formContext.getControl('nav_km').setVisible(false);
            formContext.getControl('nav_ownerscount').setVisible(false);
            formContext.getControl('nav_isdamaged').setVisible(false);
            formContext.getAttribute('nav_used').addOnChange(UsedOnChange);
        }
    }
})();