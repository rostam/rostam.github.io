let pub_div = document.getElementById("publications");
let props = ['authors', 'title', 'proceedings'];
pubs.forEach(function (pub) {
    let li_node = document.createElement("li");
    li_node.classList.add("publication");

    props.forEach(function (pp) {
        let span_node = document.createElement("span");
        span_node.classList.add(pp);
        span_node.innerHTML = pub[pp];
        li_node.appendChild(span_node);
    });

    let span_node = document.createElement("span");
    let kw = pub.keywords;
    let kws = kw.split(',');
    let str = "<table><tr>";
    kws.forEach(function (k) {
        str +="<td><div class= 'square "+ k.trim() + "'>";
        str += k.trim() + "</div></td>";
    });
    span_node.innerHTML = str;
    li_node.appendChild(span_node);

    pub_div.appendChild(li_node);
});

function clickCategory(cat) {
    let all = document.getElementsByClassName("publication");
    for(let i = 0;i < all.length;i++) {
        // console.log(all[i]);
        let txt = all[i].childNodes[3].innerHTML;
        if(txt.indexOf(cat) == -1) all[i].hidden = true;
    }
}