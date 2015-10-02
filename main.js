"use strict";
(function () {

    var $ = function (selector) {
        return document.querySelector(selector);
    }

    //
    var $$ = function (selector) {
        return [].slice.call(document.querySelectorAll(selector));
    }

    //converts text name of the function to the function
    //ex. callbackFactory("funcName") will be convert to funcName
    function callbackFactory(callName) {
        var defaultEvent = function() { throw new Error("Unimplemented method") };
        var func = null;
        //function name should starts from letter _ or $
        if (/^[a-z_$][a-z0-9_$]*$/i.test(callName)) {
            try {
                func = eval(callName);
            } catch (e) {
                return defaultEvent;
            }
        }
        return func && typeof func == "function" ? func : defaultEvent;
    }

    window.onload = onload;

    var dragged = null;

    function onDrag(event) {
        console.log(this.innerHTML + " onDrag");
    }

    function onDragStart(event) {
        dragged = this;
        //sets the data to be transfered
        event.dataTransfer.setData('dataKey', "some data here");
        console.log(this.innerHTML + " onDragStart");
    }

    function onDragOver(event) {
        event.preventDefault();
        this.style.backgroundColor = "#FF0000";
        console.log(this.innerHTML + " onDragOver");        
    }

    function onDragLeave(event) {        
        this.style.backgroundColor = "#FFFFFF";
        console.log(this.innerHTML + " onDragLeave");
    }   

    function onDragEnd(event) {
        dragged = null;
        event.target.style.backgroundColor = "#00FF00";
        console.log(this.innerHTML + " onDragEnd");        
    }

    function onDrop(event) {        
        
        for (var i = 0; i < event.dataTransfer.types.length; i++) {
            console.log("["+event.dataTransfer.types[i]+"]", event.dataTransfer.getData(event.dataTransfer.types[i]));
        }

        event.preventDefault();
        event.target.style.backgroundColor = "#0000FF";
        var draggedText = dragged && dragged.innerHTML || "empty";
        console.log(draggedText + " dropped on " + this.innerHTML);

        //read all transfered data
        for (var i = 0; i < event.dataTransfer.files.length; i++) {
            console.log(event.dataTransfer.files[i].name);
        }
    }

        
    function onload() {                

        $$(".draggable")
            .forEach(function (element) {
                element.ondrag = onDrag;
                element.ondragstart = onDragStart;
                element.ondragend = onDragEnd;
                element.ondragover = onDragOver;
                element.ondragenter = ondragenter;
                element.ondragleave = onDragLeave;
                element.ondrop = onDrop;
            });
    }               

})();