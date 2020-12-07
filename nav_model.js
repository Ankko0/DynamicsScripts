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

Navicon.nav_model = (function () {

    var roles = [];
    roles[0] = "Системный администратор";

    function currentUserHasSecurityRole(roles) {
        var fetchXml =
            "<fetch mapping='logical'>" +
            "<entity name='systemuser'>" +
            "<attribute name='systemuserid' />" +
            "<filter type='and'>" +
            "<condition attribute='systemuserid' operator='eq-userid' />" +
            "</filter>" +
            "<link-entity name='systemuserroles' from='systemuserid' to='systemuserid' visible='false' intersect='true'>" +
            "<link-entity name='role' from='roleid' to='roleid' alias='r'>" +
            "<filter type='or'>";

        for (var i = 0; i < roles.length; i++) {
            fetchXml += "<condition attribute='name' operator='eq' value='" + roles[i] + "' />";
        }

        fetchXml += "            </filter>" +
            "</link-entity>" +
            "</link-entity>" +
            "</entity>" +
            "</fetch>";
        var modifiedFetchXml = fetchXml.replace("&", "&amp;");
        var users = ExecuteFetch(modifiedFetchXml, "systemusers");
        if (users > 0)
            return true;
        else
            return false;
    }

    function LockModelChange(isLock, formContext) {
        try {
            formContext.getControl('nav_name').setDisabled(isLock);
            formContext.getControl('ownerid').setDisabled(isLock);
            formContext.getControl('nav_year').setDisabled(isLock);
            formContext.getControl('nav_details').setDisabled(isLock);
            formContext.getControl('nav_kp').setDisabled(isLock);
            formContext.getControl('nav_brandid').setDisabled(isLock);
            formContext.getControl('nav_vloume').setDisabled(isLock);
            formContext.getControl('nav_recommendedamount').setDisabled(isLock);
            formContext.getControl('nav_color').setDisabled(isLock);
        } catch (e) {
            formContext.ui.setFormNotification("Произошла ошибка" + e.message, "ERROR", "ER-CRD-NT-SLCTD");
            console.log(e.message);
        }
    }

    function ExecuteFetch(originalFetch, entityname) {
        var count = 0;
        var fetch = encodeURI(originalFetch);

        var serverURL = Xrm.Page.context.getClientUrl();
        var Query = entityname + "?fetchXml=" + fetch;
        var req = new XMLHttpRequest();
        req.open("GET", serverURL + "/api/data/v8.0/" + Query, false);
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.onreadystatechange = function () {
            if (this.readyState == 4 /* complete */) {
                req.onreadystatechange = null;
                if (this.status == 200) {
                    var data = JSON.parse(this.response);
                    if (data != null) {
                        count = data.value.length;
                    }
                } else {
                    var error = JSON.parse(this.response).error;
                    alert(error.message);
                }
            }
        };
        req.send();
        return count;
    }

    return {
        /* Создавать модели могут все. Изменять поля в объекте Модель может только пользователь с ролью Системный Администратор.*/
        OnLoad: function (context) {
            let formContext = context.getFormContext();
            if (formContext.ui.getFormType() === Navicon.formTypeEnum.Update) {
                var hasAdminRole = currentUserHasSecurityRole(roles);
                if (!hasAdminRole)
                    LockModelChange(true, formContext);
                else
                    LockModelChange(false, formContext);
            }
        }
    }
})();