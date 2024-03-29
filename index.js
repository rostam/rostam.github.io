let pub_div = document.getElementById("publications");
let props = ['authors', 'title', 'proceedings'];
let cats = ["GTA", "CSC", "DAV", "EDU", "PAC"]
pubs.forEach(function (pub) {
    let li_node = document.createElement("li");
    li_node.classList.add("publication");
    props.forEach(function (pp) {
        let span_node = document.createElement("span");
        span_node.classList.add(pp);
        span_node.innerHTML = pub[pp];
        li_node.appendChild(span_node);
    });
    if(pub['doi'] != undefined) {
        let a_node = document.createElement("a");
        a_node.href = pub['doi'];
        a_node.innerHTML= "(link)";
        li_node.appendChild(a_node);
    }
    let span_node = document.createElement("span");
    let kw = pub.keywords;
    let kws = kw.split(',');
    let str = "<table><tr>";
    kws.forEach(function (k) {
        str += "<td><div class= 'mysquare " + k.trim() + "'>";
        str += k.trim() + "</div></td>";
    });
    span_node.innerHTML = str;
    li_node.appendChild(span_node);
    pub_div.appendChild(li_node);
});

function clickCategory(cat) {
    let all = document.getElementsByClassName("publication");
    cats.forEach(function (c) {
        document.getElementById(c + "-cat").style.fontWeight = "normal";
    });
    document.getElementById(cat + "-cat").style.fontWeight = "bold";
    for (let i = 0; i < all.length; i++) {
        all[i].hidden = false;
    }
    cats.forEach(function (c) {
        if (document.getElementById(c + "-cat").style.fontWeight == "bold") {
            for (let i = 0; i < all.length; i++) {
                let txt = all[i].innerHTML;
                if (txt.indexOf("mysquare "+c) == -1) all[i].hidden = true;
            }
        }
    });
}
