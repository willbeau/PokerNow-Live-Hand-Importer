
window.onload = () => {
    loadOptions();
    document.getElementById("save-changes").addEventListener("click", saveOptions);
}

function setPCT(str) {
    return str.split(",").map(p => p/100);
}

function getPCT(pct) {
    return pct.split(",").map(p => 100*p);
}

function loadOptions() {
    try {
        browser.storage.local.get({
            enableRNG: false,
            enableCustomBets: false,
            preflopBB: "2.5,3",
            preflopPCT: "0.5,1",
            flopBB: "",
            flopPCT: "0.5,1",
            turnBB: "",
            turnPCT: "0.5,1",
            riverBB: "",
            riverPCT: "0.5,1"
        }).then(res => {
            try {
                Object.keys(res).forEach(key => {
                    var field = document.getElementById(key);
    
                    if (field.type == 'checkbox') {
                        field.checked = res[key];
                    } else if (key.endsWith("PCT")) {
                        field.value = getPCT(String(res[key]));
                    } else {
                        field.value = res[key];
                    }
                });
            }
            catch(e) {
                alert(e);
            }
        }, err => {
            alert(err);
        });
    }
    catch(e) {
        alert(e)
    }
}

function saveOptions() {
    try {
        browser.storage.local.set({
            enableRNG: !!document.getElementById("enableRNG").checked,
            enableCustomBets: !!document.getElementById("enableCustomBets").checked,
            preflopBB: document.getElementById("preflopBB").value,
            preflopPCT: setPCT(document.getElementById("preflopPCT").value),
            flopBB: document.getElementById("flopBB").value,
            flopPCT: setPCT(document.getElementById("flopPCT").value),
            turnBB: document.getElementById("turnBB").value,
            turnPCT: setPCT(document.getElementById("turnPCT").value),
            riverBB: document.getElementById("riverBB").value,
            riverPCT: setPCT(document.getElementById("riverPCT").value)
        }).then(_=>_, err=>alert(err));
    }
    catch(e) {
        alert(e)
    }
}
