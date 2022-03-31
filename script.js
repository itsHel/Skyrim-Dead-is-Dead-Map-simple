// Colors - AA1111 FFFFFF EBEBEB 000000

(function(){
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);

    const map = $("#map");
    const mapWrapper = $("#map-wrapper");
    const baseImg = $("#type-select option").value;
    const loading = $("#loading");
    const imgDir = "";
    const counterSize = 32;
    const scalling = {
        "https://www.gamebanshee.com/skyrim/mapofskyrim/skyrimmap.png": "none",
        "https://images.uesp.net/e/ef/SR-map-Skyrim.jpg": "translate(-0.85%, 0.65%) scale(1.05, 1.135)"
    }

    var mapScale = parseFloat(localStorage["scale"] || 1);
    // Object of arrays of times when was death counted, arrays are named as coords: "x142y444"
    var deaths = JSON.parse(localStorage["data"] || "{}");
    var mapType = localStorage["mapType"] || baseImg;
    map.src = imgDir + mapType;

    window.addEventListener("load", function(){
        init();
    });
    
    if(map.complete){
        mapWrapper.style.opacity = 1;
        mapWrapper.style.transform = "none";
        loading.style.display = "none";
    } else {
        map.addEventListener("load", function(){
            mapWrapper.style.opacity = 1;
            mapWrapper.style.transform = "none";
            loading.style.display = "none";
        });                
    }

    function init(){
        document.documentElement.style.setProperty("--counter-size", counterSize + "px");
        
        map.style.transform = scalling[mapType];

        $("nav").style.width = "calc(100vw - " + (window.innerWidth - document.documentElement.clientWidth) + "px)";

        // Select
        let typeSelect = $("#type-select");
        typeSelect.value = mapType;

        if(mapType != baseImg){
            typeSelect.value = mapType;
        }

        typeSelect.addEventListener("change", function(){
            map.src = imgDir + this.value;
            map.style.transform = scalling[this.value];

            loading.style.display = "block";
            window.localStorage["mapType"] = this.value;
        });

        customSelect(typeSelect, {theme: "dark"});

        // Load history
        let i = 0;
        let listHtml = "";
        for(const prop in deaths){
            let x = prop.match(/x(\d+)y/)[1];
            let y = prop.match(/y(\d+)s/)[1];
            let scale = prop.match(/s(.+)/)[1];

            insertCounter(x, y, scale, deaths[prop].length);
            listHtml += getListItemHtml("x" + x + "y" + y + "s" + scale, deaths[prop].length);
            i += deaths[prop].length;
        }

        $("#count-val").textContent = i;
        if(i){
            $("#sidemenu-list").insertAdjacentHTML("beforeend", listHtml);
            $("#sidemenu-wrapper").style.display = "flex";
        }

        if(mapScale != 1){
            if(map.complete){
                setZoom();
            } else {
                map.addEventListener("load", function(){
                    setZoom();
                });
            }
        } else {
            $("#scale-val").textContent = 100;
        }

        $(".plus").addEventListener("click", function(){
            let newScale = mapScale;
        
            newScale = (newScale * 1.1).toFixed(2);
            newScale = Math.ceil(newScale * 10) / 10;
            newScale = Math.min(8, newScale);
        
            mapScale = newScale;
            setZoom();
        });
        $(".minus").addEventListener("click", function(){
            let newScale = mapScale;

            newScale = (newScale / 1.1).toFixed(2);
            newScale = Math.floor(newScale * 10) / 10;
            newScale = Math.max(0.2, newScale);

            mapScale = newScale;
            setZoom();
        });

        $("#sidemenu-toggle").addEventListener("click", function(){
            let wrapper = this.parentNode;
            if(wrapper.classList.contains("side-hidden")){
                // Show
                wrapper.classList.remove("side-hidden");
            } else {
                // Hide
                wrapper.classList.add("side-hidden");
            }
        });

        $("#sidemenu").addEventListener("mouseup", function(e){
            if(e.target.nodeName == "LI"){
                let target = document.getElementById("counter-" + e.target.id);             // Must be getElementById because id contains dot

                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });

                target.focus({preventScroll: true});
            }
        });

        mapWrapper.addEventListener("click", function(e){
            if(e.target.nodeName != "IMG")
                return;

                // layerX works in Chrome and Opera despite MDN saying it doesnt
                let x = e.layerX || e.offsetX;
                let y = e.layerY || e.offsetY;

                createCounter(x, y, mapScale);
        });

        window.addEventListener("wheel", wheelZoom, {passive: false});

        window.addEventListener("beforeunload", function(){
            localStorage["scale"] = mapScale;
        });
    }

    function wheelZoom(e){
        if(e.ctrlKey){
            e.preventDefault();
            if(e.deltaY < 0){
                $(".plus").click();
            } else {
                $(".minus").click();
            }
        }
    }

    // Only on page load
    function insertCounter(x, y, scale, count){
        let saveX = x * (mapScale / scale);
        let saveY = y * (mapScale / scale);

        let html = getCounterHtml(count, saveX, saveY, x, y, scale);

        mapWrapper.insertAdjacentHTML("beforeend", html);

        let div = $(".counter:last-of-type");
        let countDiv = div.querySelector(".count");

        div.addEventListener("click", function(e){
            let remove = false;

            if(!e.target.closest(".arrow-bottom")){
                // ++
                countDiv.textContent = parseInt(countDiv.textContent) + 1;
                
                $("#count-val").textContent = parseInt($("#count-val").textContent) + 1;
            } else {
                // --
                remove = true;
                countDiv.textContent = parseInt(countDiv.textContent) - 1;

                $("#count-val").textContent = parseInt($("#count-val").textContent) -1;

                if(countDiv.textContent == 0){
                    countDiv.closest(".counter").remove();
                }
            }

            save(x, y, scale, remove);
        });
    }

    // On map click
    function createCounter(x, y, scale){
        let saveX = x - ((counterSize / 2) * scale);
        let saveY = y - ((counterSize / 2) * scale);
        
        let html = getCounterHtml(1, saveX, saveY);

        mapWrapper.insertAdjacentHTML("beforeend", html);

        let div = $(".counter:last-of-type");
        let countDiv = div.querySelector(".count");
        div.focus();

        $("#count-val").textContent = parseInt($("#count-val").textContent) + 1;
        save(saveX, saveY, scale);

        div.addEventListener("click", function(e){
            let remove = false;

            if(!e.target.closest(".arrow-bottom")){
                // ++
                countDiv.textContent = parseInt(countDiv.textContent) + 1;
                
                $("#count-val").textContent = parseInt($("#count-val").textContent) + 1;
            } else {
                // --
                remove = true;
                countDiv.textContent = parseInt(countDiv.textContent) - 1;

                $("#count-val").textContent = parseInt($("#count-val").textContent) -1;

                if(countDiv.textContent == 0){
                    countDiv.closest(".counter").remove();
                }
            }

            save(saveX, saveY, scale, remove);
        });
    }

    function getCounterHtml(count, x, y, basex = x, basey = y, scale = mapScale){
        let html = `<div id="counter-x${Math.round(basex)}y${Math.round(basey)}s${scale}" class="counter" style="left: ${x}px; top: ${y}px; transform:scale(${mapScale})" data-basex="${basex}" data-basey="${basey}" data-scale=${scale} tabindex=${count}>
                        <span class="arrow arrow-top"><svg viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14l-6-6z"/></svg></span>
                        <span class=count>${count}</span>
                        <span class="arrow arrow-bottom"><svg viewBox="0 0 24 24"><path d="M24 24H0V0h24v24z" fill="none" opacity=".87"/><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z"/></svg></span>
                    </div>`;
        return html;
    }

    function setZoom(){
        // Save scroll
        let oldWidth = $("body").offsetWidth;
        let widthRatio = window.scrollX / oldWidth;
        let oldHeight = $("body").offsetHeight;
        let heightRatio = window.scrollY / oldHeight;

        map.width = map.dataset.width * mapScale;
        map.height = map.dataset.height * mapScale;

        // Zoom texts
        $$(".counter").forEach((el) => {
            let zoomEdit = mapScale / el.dataset.scale;
            el.style.left = (parseInt(el.dataset.basex) * zoomEdit) + "px";
            el.style.top = (parseInt(el.dataset.basey) * zoomEdit) + "px";
            el.style.transform = "scale(" + mapScale + ")";
        });

        $("#scale-val").textContent = parseInt(mapScale * 100);

        // Scroll to previous pos
        let newHeight = $("body").offsetHeight;
        let newTop = newHeight * heightRatio;
        
        let newWidth = $("body").offsetWidth;
        let newLeft = newWidth * widthRatio;

        window.scroll({left: newLeft, top: newTop});
    }

    function save(x, y, scale, remove = false){
        let divName = "x" + Math.round(x) + "y" + Math.round(y) + "s" + scale;
        let newAdded = false;

        if(remove){
            deaths[divName].pop();

            if(!deaths[divName].length){
                delete deaths[divName];
            }
        } else {
            if(!(deaths[divName])){
                deaths[divName] = [];

                $("#sidemenu-list").insertAdjacentHTML("beforeend", getListItemHtml(divName));
                newAdded = true;
            }

            deaths[divName].push(Math.round(Date.now()/1000));
        }

        if(!newAdded){
            editList(divName, remove);
        }

        let total = $("#count-val").textContent;
        if(total == 0){
            $("#sidemenu-wrapper").style.display = "none";
        } else if(total == 1){
            $("#sidemenu-wrapper").style.display = "flex";
        }

        localStorage["data"] = JSON.stringify(deaths);
    }

    function editList(id, remove){
        let target = document.getElementById(id);           // Must be getElementById because id contains dot
        let content = target.textContent;

        if(remove){
            target.textContent = parseInt(content) - 1;
            
            if(target.textContent == 0){
                target.remove();
            }
        } else {
            target.textContent = parseInt(content) + 1;
        }
    }

    function getListItemHtml(id, count = 1){
        let html = `<li id="${id}">${count}</li>`;

        return html;
    }
})();
