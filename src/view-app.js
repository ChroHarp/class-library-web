// view-app.js
const borrows = db.collection('borrows');
const tb      = document.getElementById('tbody');
const noRec   = document.getElementById('noRec');

let cache = [];

// 載入並渲染
async function loadAll(){
  try {
    const snap = await borrows.orderBy('borrowDate','desc').get();
    cache = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    render(cache);
  } catch(err) {
    console.error(err);
  }
}

function render(arr) {
  const kw = document.getElementById('kw').value.trim();
  const list = kw
    ? arr.filter(o=>o.name.includes(kw)||o.book.includes(kw))
    : arr;
  tb.innerHTML = list.map(o =>
    `<tr>
       <td>${o.name}</td>
       <td>${o.book}</td>
       <td>${o.borrowDate}</td>
       <td>${o.returnDate || '尚未歸還'}</td>
     </tr>`
  ).join('') || `<tr><td colspan="4">無資料</td></tr>`;
  noRec.style.display = list.length?'none':'block';
}

document.getElementById('kw').oninput = () => render(cache);

// 初始化
loadAll();
