/* public/addBook.js  ── Compat 版 ------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 全域物件 ---------- */
  const db      = firebase.firestore();
  const storage = firebase.storage();
  const books   = db.collection('books');

  /* ---------- DOM ---------- */
  const $ = id => document.getElementById(id);
  const isbn      = $('isbn');
  const title     = $('title');
  const author    = $('author');
  const publisher = $('publisher');
  const cover     = $('cover');

  /* ---------- 0. 共用小工具 ---------- */
  const normalizeIsbn = raw => (raw.match(/\d{13}/) || [''])[0];

  /* ---------- 1. 取書目 (Google → OpenLibrary 備援) ---------- */
  async function fillMetaByIsbn(code){
    if(!code) return false;

    /* ① Google Books ------------------------------------------------ */
    try{
      let j = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${code}`)
              .then(r=>r.json());
      if(j.totalItems){
        const v = j.items[0].volumeInfo;
        title.value     ||= v.title || '';
        author.value    ||= (v.authors||[]).join('、');
        publisher.value ||= v.publisher || '';
        if(title.value && author.value) return true;
      }
    }catch(e){ console.warn('Google Books error', e); }

    /* ② OpenLibrary -------------------------------------------------- */
    try{
      let o = await fetch(`https://openlibrary.org/isbn/${code}.json`)
              .then(r=>r.ok ? r.json() : {});
      if(o.title){
        title.value ||= o.title;
        if(o.authors){
          const names = await Promise.all(
            o.authors.map(a=>fetch(`https://openlibrary.org${a.key}.json`)
              .then(r=>r.json()).then(j=>j.name))
          );
          author.value ||= names.join('、');
        }
        publisher.value ||= (o.publishers||[]).join('、');
        return true;
      }
    }catch(e){ console.warn('OpenLibrary error', e); }

    alert('找不到此 ISBN 的書目，請手動輸入');
    return false;
  }

  /* ---------- 2. 掃碼 ---------- */
  const reader  = new ZXing.BrowserMultiFormatReader();   // UMD 版僅有基本功能
  
  $('btnScan').onclick = async () => {
    $('preview').style.display = 'block';
    try{
      const res = await reader.decodeOnceFromVideoDevice(undefined, 'preview');
      $('preview').style.display = 'none';

      const code = normalizeIsbn(res.text);      // ← 只取 13 位數字
      if(!code) return alert('未偵測到 13 位 ISBN，請再試一次');

      isbn.value = code;
      await fillMetaByIsbn(code);
    }catch(err){
      console.error(err);
      alert('掃描失敗，請再試一次');
      $('preview').style.display = 'none';
    }
  };

  /* ---------- 3. 儲存 ---------- */
  $('btnSave').onclick = async () => {

    /* 最少要有 ISBN 或 (書名+作者) */
    if(!isbn.value && !(title.value && author.value)){
      return alert('請填寫 ISBN，或同時填書名與作者');
    }

    /* 若有 ISBN 但仍缺書名 → 再嘗試補一次 */
    if(isbn.value && !title.value){
      await fillMetaByIsbn(isbn.value);
    }

    /* 上傳封面 (可選) */
    let coverURL = '';
    if(cover.files[0]){
      const path = `covers/${Date.now()}_${cover.files[0].name}`;
      const snap = await storage.ref(path).put(cover.files[0]);
      coverURL   = await snap.ref.getDownloadURL();
    }

    /* 寫入 Firestore */
    await books.doc(isbn.value || undefined).set({
      isbn      : isbn.value,
      title     : title.value,
      author    : author.value,
      publisher : publisher.value,
      coverURL  : coverURL,
      createdAt : firebase.firestore.FieldValue.serverTimestamp()
    });

    alert('新增成功！');
    ['isbn','title','author','publisher'].forEach(id => $(id).value = '');
    cover.value = '';
  };

});   // DOMContentLoaded end
