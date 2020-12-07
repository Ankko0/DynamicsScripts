var Navicon = Navicon || {};

Navicon = {
    formTypeEnum: Object.freeze({
        "Undefined": 0,
        "Create": 1,
        "Update": 2,
        "Read Only": 3,
        "Disabled": 4,
        "Bulk Edit": 6
    })
}

Navicon.nav_auto = (function () {

    /* Поля на объекте Автомобиль new_auto: Пробег, Количество владельцев, был в ДТП отображаются только при значении в поле С пробегом(new_used)=true.*/
    function UsedOnChange (context) {
        let formContext = context.getFormContext();
        try {
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
        } catch (e) {
            formContext.ui.setFormNotification("Ошибка, возможно отсустствует поле. " + e.message, "ERROR", "ER-WRNG-AGRM-DAT");
        }
    }

    return {
        OnLoad: function (context) {
            let formContext = context.getFormContext();
            try {
                if (formContext.ui.getFormType() === Navicon.formTypeEnum.Create) {
                    formContext.getControl('nav_km').setVisible(false);
                    formContext.getControl('nav_ownerscount').setVisible(false);
                    formContext.getControl('nav_isdamaged').setVisible(false);
                }
                formContext.getAttribute('nav_used').addOnChange(UsedOnChange);
            } catch (e) {
                formContext.ui.setFormNotification("Ошибка, возможно отсустствует поле. " + e.message, "ERROR", "ER-WRNG-AGRM-DAT");
            }
        }
    }
})();