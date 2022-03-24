'use strict';

// Themes: "light", "dark", "split"
// Replaces already existing select
// Accepts element or nodeList
function customSelect(elements, optionsPicked = {}){
    // Todo:    - 
    
    // Set base select display:none; in css
    // Alternative chevron: ›   ˆ   ∟   ❯
    // Use "vertical-align: top;" to stop vertical center

    // Set defaults
    let options = {
        maxHeight: optionsPicked.maxHeight ?? 400,
        maxWidth: optionsPicked.maxWidth ?? 600,
        scrollOnKey: optionsPicked.scrollOnKey ?? false,
        theme: optionsPicked.theme ?? "",                       // Themes: "light", "dark", "split"
        // Callback function which stops select from being slided up if clicked on item (allows to click on multiple items without closing)
        // dontCloseCallback must return true, returning flse resets select
        dontCloseCallback: optionsPicked.dontCloseCallback ?? false,
        // Boolean, otherwise same as above
        dontClose: optionsPicked.dontClose ?? false
    }

    let originalSelectChangedByThis = false;

    if(options.theme){
        let turnOn;
        if(options.theme == "split"){
            turnOn = "light";
        } else {
            turnOn = options.theme;
        }

        document.documentElement.style.setProperty("--select-light", "var(--OFF)");
        document.documentElement.style.setProperty("--select-" + turnOn, "var(--ON)");
    }
    
    if(elements instanceof Element){
        elements = [elements];
    }

    elements.forEach(function(element){
        let selectOriginal = element;
        selectOriginal.style.display = "none";

        if(selectOriginal.nextElementSibling?.classList.contains("custom-select-wrapper")){
            selectOriginal.nextElementSibling.remove();
        }

        let headerSelect;
        // let selectFull = "<div class=\"custom-select-wrapper " + (selectOriginal.getAttribute("class") ?? "") + "\">";
        let selectFull = "<div class=\"custom-select-wrapper " + ((options.theme == "split") ? "split" : "") + "\">";
        let items = "<div class=\"select-items-wrapper\">";

        selectOriginal.querySelectorAll("option").forEach(function(option){
            let selectClass = "";
            if(option.getAttribute("selected") == "selected" || option.getAttribute("selected") || option.selected){
                headerSelect = "<div class=\"custom-select-header\"><span>" + option.textContent + "</span><span class=\"chevron\"></span></div>";
                selectClass = "custom-selected";
            }

            items += "<div title=\"" + option.textContent + "\" class=\"custom-select-item " + selectClass + "\">" + option.textContent + "</div>";
        });

        if(!headerSelect){
            let text = selectOriginal.querySelector("option").textContent;
            headerSelect = "<div class=\"custom-select-header\"><span>" + text + "</span><span class=\"chevron\"></span></div>";
            items = items.replace("custom-select-item ", "custom-select-item custom-selected");
        }

        selectFull += headerSelect + items + "</div></div>";
        selectOriginal.insertAdjacentHTML("afterend", selectFull);

        let selectFullWrapper = selectOriginal.nextElementSibling;
        let selectWrapper = selectFullWrapper.querySelector(".select-items-wrapper");
        let selectHeader = selectFullWrapper.querySelector(".custom-select-header");
        let height = selectWrapper.offsetHeight;
        
        // Setup minWidth of header text same as width of longest item
        let width = (parseFloat(selectWrapper.offsetWidth) - 2 * parseFloat(getComputedStyle(selectWrapper.querySelector("div")).padding)).toString() + "px";
        selectFullWrapper.querySelector("span:first-of-type").style.width = width;

        selectWrapper.style.maxHeight = "0px";
        selectWrapper.style.maxWidth = options.maxWidth + "px";
        selectFullWrapper.style.maxWidth = options.maxWidth + "px";

        selectWrapper.querySelectorAll(".custom-select-item").forEach(function(item, index){
            item.addEventListener("click", function(){
                if(options.dontClose || (options.dontCloseCallback && options.dontCloseCallback())){
                    if(item.classList.contains("custom-selected-multi")){
                        item.classList.remove("custom-selected-multi");
                    } else {
                        item.classList.add("custom-selected-multi");
                    }
                } else {
                    [...item.parentNode.children].forEach(el => el.classList.remove("custom-selected"));
                    item.classList.add("custom-selected");

                    originalSelectChangedByThis = true;
                    selectOriginal.nextElementSibling.querySelector("span").textContent = this.textContent;

                    [...selectOriginal.children].forEach(function(el, _index){
                        if(index == _index){
                            el.setAttribute("selected", true);
                            selectOriginal.selectedIndex = index;
                        } else {
                            el.removeAttribute("selected");
                        }
                    });

                    let changeE = new Event("change");
                    selectOriginal.dispatchEvent(changeE);
                }
            });
        });

        selectHeader.addEventListener("click", function(){
            if(!selectWrapper.innerHTML)
                return;

            if(options.dontClose || (options.dontCloseCallback && options.dontCloseCallback())){
                selectWrapper.querySelector(".custom-selected")?.classList.remove("custom-selected");
            } else {
                selectWrapper.querySelectorAll(".custom-selected-multi").forEach(item => item.classList.remove("custom-selected-multi"));
            }

            // Header
            if(selectWrapper.style.maxHeight == "0px"){
                if(height == 0){
                    selectWrapper.style.maxHeight = "";
                    height = selectWrapper.offsetHeight;
                }
                if(height > options.maxHeight){
                    height = options.maxHeight + "px";
                    selectWrapper.style.overflow = "auto";
                }

                selectWrapper.style.maxHeight = height + "px";
                selectFullWrapper.classList.add("select-open");

                // Open to top if limited space
                if(selectHeader.getBoundingClientRect().y + selectHeader.offsetHeight + parseInt(height) > window.innerHeight){
                    selectWrapper.style.bottom = "100%";
                    selectWrapper.style.top = "auto";
                } else {
                    selectWrapper.style.bottom = "auto";
                    selectWrapper.style.top = "100%";
                }
            } else {
                selectWrapper.style.maxHeight = "0px";
                selectFullWrapper.classList.remove("select-open");
            }
        });

        window.addEventListener("click", function(e){
            if(options.dontClose || (options.dontCloseCallback && options.dontCloseCallback() && e.target.classList.contains("custom-select-item")))
                return;

            if((!e.target || !e.target.parentNode) || (e.target.className != "custom-select-header" && e.target.parentNode.className != "custom-select-header")){
                selectWrapper.style.maxHeight = "0px";
                selectFullWrapper.classList.remove("select-open");
            }
        });

        // When original select is changed, update new one
        selectOriginal.addEventListener("change", function(){
            if(!originalSelectChangedByThis){
                let selected = this.options[this.selectedIndex].textContent;

                if(selectWrapper.querySelector(".custom-selected").textContent != selected){
                    [...selectWrapper.children].forEach(function(child){
                        if(child.textContent == selected){
                            selectOriginal.nextElementSibling.querySelector("span").textContent = selected;
                            [...child.parentNode.children].forEach(el => el.classList.remove("custom-selected"));
                            selectFullWrapper.classList.add("custom-selected");
                        }
                    });
                }
            }

            originalSelectChangedByThis = false;
        });
      
        // Scrolling on keypress
        if(options.scrollOnKey){
            let customSelect = selectOriginal.nextElementSibling;

            customSelect.setAttribute("tabindex", "1");
            customSelect.addEventListener("keydown", function(e){
                if(e.keyCode == 27){
                    // Close on Esc
                    customSelect.querySelector(".select-items-wrapper").style.maxHeight = "0px";
                    selectFullWrapper.classList.remove("select-open");
                }

                let scrolled = false;
                customSelect.querySelectorAll(".select-items-wrapper div:not(:first)").each(function(el){
                    if(!scrolled && el.textContent[0].toLowerCase() == e.key){
                        scrolled = true;

                        // let top = $(this).position().top + $(this).parent().scrollTop();
                        let top = el.offsetTop + el.parentNode.scrollTop;
                        customSelect.querySelector(".select-items-wrapper").scrollTo({top: top, behavior: "smooth"});
                    }
                });
            });
        }
    });
}
