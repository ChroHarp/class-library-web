/* ---------- A. 一次抓書庫書名，給 autocomplete 用 ---------- */
(async () => {
  let bookList = [];
  try {
    // compat 版沒有 select()，直接撈整份文件再取 title
    const snap = await db.collection('books').get();
    bookList   = snap.docs
                 .map(d => d.data().title || '')
                 .filter(t => t);          // 移除空字串
  } catch(e){
    console.warn('載入書庫失敗', e);
  }

  /* --- autocomplete --- */
  const bookInput = document.getElementById('book');
  const sugg      = document.getElementById('suggestions');

  bookInput.addEventListener('input', () => {
    const q = bookInput.value.trim().toLowerCase();
    if(!q){ sugg.innerHTML=''; return; }

    const hits = bookList
      .filter(b => b.toLowerCase().includes(q))
      .slice(0,8);

    sugg.innerHTML = hits.map(h => `<li>${h}</li>`).join('');
  });

  sugg.addEventListener('click', e => {
    if(e.target.tagName !== 'LI') return;
    bookInput.value = e.target.textContent;
    sugg.innerHTML  = '';
  });

  document.addEventListener('click', e => {
    if(e.target !== bookInput) sugg.innerHTML = '';
  });
})();   // <── IIFE 結束

/* ---------- B. 以下是你原本的借閱 / 查詢 / 還書 ---------- */
const borrows = db.collection('borrows');
const today   = () => new Date().toISOString().slice(0,10);

const $ = id => document.getElementById(id);

/* 借閱 */
$('fBorrow').onsubmit = async e => {
  e.preventDefault();

  const name    = $('name').value.trim();
  const journal = $('type').value;
  const issue   = $('issue').value;
  const book    = $('book').value.trim();
  const list    = [];

  if (issue && journal)
      list.push({ name, book:`${journal} 第${issue}期`, borrowDate:today(), returnDate:null });
  if (book)
      list.push({ name, book, borrowDate:today(), returnDate:null });

  if (!list.length){
    alert('請填寫期刊或書名'); return;
  }

  try{
    const batch = db.batch();
    list.forEach(r => batch.set(borrows.doc(), r));
    await batch.commit();

    alert('借閱成功！');
    $('fBorrow').reset();
    $('suggestions').innerHTML='';
  }catch(err){
    console.error(err);
    alert('借閱失敗，請稍後再試');
  }
};

/* 查詢未還 */
$('btnQuery').onclick = async () => {
  const name = $('name').value.trim();
  if(!name){ alert('請先輸入姓名'); return; }

  try{
    const snap = await borrows
                   .where('name','==',name)
                   .where('returnDate','==',null)
                   .orderBy('borrowDate','desc')
                   .get();

    const arr = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    $('list').innerHTML = arr.length
      ? arr.map(o=>`<li><label><input type="checkbox" value="${o.id}"> ${o.book} (${o.borrowDate})</label></li>`).join('')
      : '<li>無未還紀錄</li>';

    $('btnReturn').style.display = arr.length ? 'inline-block' : 'none';
  }catch(err){
    console.error(err);
    alert('查詢失敗：' + err.message);
  }
};

/* 還書 */
$('btnReturn').onclick = async () => {
  const ids = [...document.querySelectorAll('#list input:checked')].map(i=>i.value);
  if(!ids.length) return;

  try{
    const batch = db.batch();
    ids.forEach(id => batch.update(borrows.doc(id), { returnDate: today() }));
    await batch.commit();

    $('btnQuery').click();   // 重新刷新列表
  }catch(err){
    console.error(err);
    alert('還書失敗');
  }
};
