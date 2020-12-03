// JavaScript source code
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

Navicon.nav_agreement = (function () {

    var ContactOnChange = function (context) {
        let formContext = context.getFormContext();
        let contactAttr = formContext.getAttribute('nav_contactid');
        let autoAttr = formContext.getAttribute('nav_autoid');
        if (contactAttr.getValue() !== null && autoAttr.getValue() !== null) {
            formContext.getControl('nav_creditid').setVisible(true);
        } else {
            formContext.getControl('nav_creditid').setVisible(false);
        }
    }

    var CreditidOnChange = function (context) {
        let formContext = context.getFormContext();
        let creditAttr = formContext.getAttribute('nav_creditid');
        if (creditAttr.getValue() !== null)
            Xrm.Page.ui.tabs.get("nav_detailstab").sections.get("nav_creditsection").setVisible(true);

        Xrm.WebApi.retrieveRecord("nav_credit", formContext.getAttribute("nav_creditid").getValue()[0].id, "?$select=nav_creditperiod")
            .then(function (creditResult) {
                formContext.getAttribute('nav_creditperiod').setValue(creditResult.nav_creditperiod);
            })
    }

    var NameOnChange = function (context) {
        let formContext = context.getFormContext();
        let nameAttr = formContext.getAttribute('nav_name');
        const regExp = /[^0-9-]+/g;
        nameAttr.setValue(nameAttr.getValue().replace(regExp, ''));
    }

    function AutoOnChange(context) {
        ContactOnChange(context);
        let formContext = context.getFormContext();
        if (formContext.getAttribute("nav_autoid").getValue() == null)
            return;
        Xrm.WebApi.retrieveRecord("nav_auto", formContext.getAttribute("nav_autoid").getValue()[0].id, "?$select=nav_used,nav_amount, nav_modelid")
            .then(function (autoResult) {
                if (autoResult.nav_used) {
                    formContext.getAttribute('nav_summa').setValue(autoResult.nav_amount);
                } else {
                    Xrm.WebApi.retrieveRecord("nav_model", autoResult.nav_modelid, "?$select=nav_recommendedamount")
                        .then((modelresult) => {
                            formContext.getAttribute('nav_summa').setValue(modelresult.nav_recommendedamount);
                        });
                }
            });
    }

    return {

        onLoad: function (context) {
            let formContext = context.getFormContext();
            formContext.getAttribute('nav_contactid').addOnChange(ContactOnChange);
            formContext.getAttribute('nav_autoid').addOnChange(AutoOnChange);
            formContext.getAttribute('nav_creditid').addOnChange(CreditidOnChange);
            formContext.getAttribute('nav_name').addOnChange(NameOnChange);
            if (formContext.ui.getFormType() === Navicon.formTypeEnum.Create) {
                formContext.getControl('nav_creditid').setVisible(false);
                Xrm.Page.ui.tabs.get("nav_detailstab").sections.get("nav_creditsection").setVisible(false);
            }
        },

        /*проверить отмену сохранения*/
        OnSave: function (context) {
            let formContext = context.getFormContext();
            let dateAttr = formContext.getAttribute('nav_date');
            let creditAttr = formContext.getAttribute("nav_creditid");
            if (creditAttr !== null && creditAttr.getValue() !== null)
                Xrm.WebApi.retrieveRecord("nav_credit", creditAttr.getValue()[0].id, "?$select=nav_datestart,nav_dateend")
                    .then(function (creditResult) {
                            console.log("Date Start:" + creditResult.nav_datestart + " Date End:" + creditResult.nav_dateend);
                            var creditDateStart = moment(creditResult.nav_datestart);
                            var creditDateEnd = moment(creditResult.nav_dateend);
                            var agreemDate = moment(dateAttr.getValue());
                            if (creditDateStart.add(1, 'years').isAfter(creditDateEnd)) {
                                var saveEvent = context.getEventArgs();
                                formContext.ui.setFormNotification("Срок действия кредитного договора меньше одного года", "ERROR", "ER-WRNG-CRDT-DAT");
                                /* НЕ РАБОТАЕТ !*/
                                saveEvent.preventDefault();
                            }
                            /* НАДО ФИКСИТЬ */
                            else if (dateAttr.getValue() !== null && (agreemDate.isAfter(creditDateEnd) || agreemDate.isBefore(creditDateStart))) {
                                var saveEvent = context.getEventArgs();
                                formContext.ui.setFormNotification("Срок действия кредитного договора не соответствует дате договора.", "ERROR", "ER-WRNG-AGRM-DAT");
                                /* НЕ РАБОТАЕТ !*/
                                saveEvent.preventDefault();
                            } else {
                                formContext.ui.clearFormNotification("ER-WRNG-CRDT-DAT");
                                formContext.ui.clearFormNotification("ER-WRNG-AGRM-DAT");
                            }
                        }
                    );
        },

        CreditRecount: function () {
            let formContext = Xrm.Page;
            if (formContext.getAttribute('nav_creditid').getValue() == null) {
                formContext.ui.setFormNotification("Кредит не выбран", "ERROR", "ER-CRD-NT-SLCTD");
            }
            formContext.ui.clearFormNotification("ER-CRD-NT-SLCTD");
            let creditAmountAttr = formContext.getAttribute("nav_creditamount");
            if (creditAmountAttr == null)
                return;
            let agrmntAmount = parseFloat(formContext.getAttribute('nav_summa').getValue()) || 0;
            let creditInitialAmount = parseFloat(formContext.getAttribute('nav_initialfee').getValue()) || 0;
            /* Not null*/
            if (agrmntAmount !== null && creditInitialAmount !== null)
                creditAmountAttr.setValue(agrmntAmount - creditInitialAmount);

            let fullCreditAmountAttr = formContext.getAttribute("nav_fullcreditamount");
            if (fullCreditAmountAttr == null)
                return;
            let creditPeriod = parseFloat(formContext.getAttribute("nav_creditperiod").getValue()) || 0;
            let creditAmount = parseFloat(formContext.getAttribute("nav_creditamount").getValue()) || 0;
            if (creditPeriod !== null && creditAmount !== null)
                Xrm.WebApi.retrieveRecord("nav_credit", formContext.getAttribute("nav_creditid").getValue()[0].id, "?$select=nav_percent")
                    .then(function (creditResult) {
                        let creditFee = (parseFloat(creditResult.nav_percent) || 0) / 100 * creditPeriod * creditAmount;
                        let finalAmount = creditFee + creditAmount;
                        fullCreditAmountAttr.setValue(finalAmount);
                    })
        }
    }
})
();
