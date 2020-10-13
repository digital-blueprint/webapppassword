// Note: This doesn't have a lit-element dependency on purpose, so it can be loaded faster before
// other web components (assuming it's not bundled)

export class Spinner extends HTMLElement {

    constructor() {
        super();
        let shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = `
<style>
:host {
    display: block;
}
#all-spinner-tuglogo {
  width:130px;
    height:130px;
      position:relative;
        background-color:transparent;
          margin:0 auto;
}

.all-spinner-tuglogo-box {
  width:20%;
    height:20%;
     background-color:#e4154b;
        position:absolute;
          top:50%;
            left:50%;
          animation-duration: 1.6s;
            animation-direction:alternate;
              animation-iteration-count:infinite;
    animation-fill-mode:both;
      animation-timing-function:ease;
        transition: transform 0.5s, background-color 0.2s 0.5s;
}

#all-spinner-tuglogo-box-1 {
      animation-name: box1;
        transform:translateX(-160%) translateY(-50%);
}

#all-spinner-tuglogo-box-2 {
      transform-origin:0 0;
      animation-name: box2;
transform:scale(1) translateX(-50%) translateY(-50%);
}

#all-spinner-tuglogo-box-3 {

      animation-name: box3;
        animation-delay:0.3s;
          transform:translateX(60%) translateY(-50%); visibility:visible;
}

#all-spinner-tuglogo-box-4 {

      animation-name: box4;
        animation-delay:0.1s;
transform:translateX(0%) translateY(-100%);  visibility:visible;
}

#all-spinner-tuglogo-box-5 {

      animation-name: box5;
        animation-delay:0.2s;
transform:translateX(-100%) translateY(0%);  visibility:visible;
}

@keyframes box1 {
    0% { transform:translateX(-50%) translateY(-50%); visibility:hidden; }
    50% { transform:translateX(-50%) translateY(-50%); visibility:hidden; }
    70% { transform:translateX(-170%) translateY(-50%); visibility:visible;}
    80% { transform:translateX(-160%) translateY(-50%); visibility:visible;}
  100%  { transform:translateX(-160%) translateY(-50%); visibility:visible;}
}

@keyframes box2 {
    0% { transform:scale(0) translateX(-50%) translateY(-50%);}
    5% { transform:scale(0) translateX(-50%) translateY(-50%);}
    30% { transform:scale(1.2) translateX(-50%) translateY(-50%);}
    35% { transform:scale(1) translateX(-50%) translateY(-50%);}
  100% { transform:scale(1) translateX(-50%) translateY(-50%);}

}

@keyframes box3 {
    0% { transform:translateX(-50%) translateY(-50%); visibility:hidden; }
    50% { transform:translateX(-50%) translateY(-50%); visibility:hidden; }
    70% { transform:translateX(70%) translateY(-50%); visibility:visible;}
    80% { transform:translateX(60%) translateY(-50%); visibility:visible;}
  100%  { transform:translateX(60%) translateY(-50%); visibility:visible;}
}

@keyframes box4 {
    0%  { transform:translateX(-50%) translateY(-50%);  visibility:hidden; }
    50% { transform:translateX(-50%) translateY(-50%);  visibility:hidden; }
    70% { transform:translateX(10%) translateY(-110%);  visibility:visible;}
    80% { transform:translateX(0%) translateY(-100%);  visibility:visible;}
  100%  { transform:translateX(0%) translateY(-100%);  visibility:visible;}
}
@keyframes box5 {
    0%  { transform:translateX(-50%) translateY(-50%);  visibility:hidden; }
    50% { transform:translateX(-50%) translateY(-50%);  visibility:hidden; }
    70% { transform:translateX(-110%) translateY(10%);  visibility:visible;}
    80% { transform:translateX(-100%) translateY(0%);  visibility:visible;}
  100%  { transform:translateX(-100%) translateY(0%);  visibility:visible;}
}
</style>

<div id="all-spinner-tuglogo">
  <div id="all-spinner-tuglogo-box-1" class="all-spinner-tuglogo-box"></div>
  <div id="all-spinner-tuglogo-box-2" class="all-spinner-tuglogo-box"></div>
  <div id="all-spinner-tuglogo-box-3" class="all-spinner-tuglogo-box"></div>
  <div id="all-spinner-tuglogo-box-4" class="all-spinner-tuglogo-box"></div>
  <div id="all-spinner-tuglogo-box-5" class="all-spinner-tuglogo-box"></div>
</div>`;
    }
}