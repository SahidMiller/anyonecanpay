export default function LanguagePicker() {
  return <>
    <div id="languageSelector" class="fixed-action-btn">
      <b id="currentLanguage" data-string="changeLanguage"></b>
      <a class="btn-floating btn-large green"><i class="large icon-translate"></i></a>
        <ul id="languageList">
          <li><a class="btn-floating purple darken-2" id="translateEnglish">En</a></li>
          <li><a class="btn-floating pink darken-2" id="translateChinese">Cn</a></li>
          <li><a class="btn-floating red darken-1" id="translateJapanese">Ja</a></li>
          <li><a class="btn-floating orange darken-2" id="translateSpanish">Es</a></li>
        </ul>
    </div>
  </>
}