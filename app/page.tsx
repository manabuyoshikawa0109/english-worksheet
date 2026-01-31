//「このファイルおよび、ここからインポートされる全てのモジュールは
// クライアントサイドで実行されるコンポーネントである」と宣言するためのディレクティブ
// ユーザーの操作に応じて状態が変わるようなインタラクティブなUIを実装するには、
// ブラウザ(クライアントサイド)でJavaScriptを実行する必要があるため
// Client Componentであることを明示的に指定する
'use client'

import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';

// 型宣言
// 以下理由によりコンポーネント関数(export defaultで定義される部分)の外に書くのが慣習
// 1.ファイル全体、さらには必要に応じて他のファイルからもインポートして再利用しやすくするため
// 2.コンポーネント関数内は再レンダリングのたびに実行されるので型宣言が再評価されることになりロジック上無駄であるため

// 罫線のスタイルオブジェクト内の値の型を宣言
type LineStyle = {
  color: string;
  style: string;
};

// contentEditable属性を持つdiv要素の型
type ContentEditableElement = HTMLDivElement | null;

// コンポーネント関数(export defaultで定義される部分)の中には、主にUIのレンダリングに関するロジック(JSX、useState等)を記載する
// データ整形や計算などの純粋なロジックは、コンポーネント関数の外に出す
export default function EnglishWorksheet() {
  // 変数とセッター関数を定義。useState内の値は変数の初期値

  // 英語ワークシートのタイトル
  const [title, setTitle] = useState("");

  // サイドバーの開閉状態を管理
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);

  // line-groupのインデックス数(1〜9)を持つ配列
  const [lineGroupIndexes] = useState(Array.from({ length: 9 }, (_, i) => i + 1));

  // 罫線のインデックス数(1〜4)を持つ配列
  const [lineIndexes] = useState(Array.from({ length: 4 }, (_, i) => i + 1));

  // 各罫線のスタイルを保持した変数
  // 動的に作成したline${i}がline1〜4のいずれかと分からずキーが存在しないエラーとなるため、
  // キーがstring型、値はLineStyle型であることを宣言
  const [lineStyles, setLineStyles] = useState<Record<string, LineStyle>>({
    line1: { color: "#000000", style: "solid" },
    line2: { color: "#000000", style: "dashed" },
    line3: { color: "#33CCFF", style: "solid" },
    line4: { color: "#000000", style: "solid" },
  });

  // 罫線のスタイルを取得する関数
  // lineStyles変数がsetLineStyleセッター関数により変更されると
  // コンポーネントが再レンダリングされ、新しいスタイルが適用される
  const getBorderTopStyle = (lineKey: string) => {
      const { color, style } = lineStyles[lineKey];
      return {borderTop: `1px ${style} ${color}`};
  };

  // セレクトボックスで現在選択されている罫線(初期値はline1)
  const [selectedLineKey, setSelectedLineKey] = useState('line1');

  // 罫線のスタイルが変更されたときのイベントハンドラー
  const changeTargetLineStyle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // 選択された罫線のスタイルを取得
    const selectedLineStyle = e.target.value;

    // セッター関数の引数に関数を渡すことができる
    // その場合、この関数が実行された時点の最新のlineStylesの値を引数に受け取ることができる
    // 新しいStateの値が前のStateの値に依存している(更新対象外の罫線の色やスタイルはそのまま保持しておきたい)時に必須の書き方
    // オブジェクトスプレッド構文により、後に記述されたプロパティが先に記述された同名のプロパティを上書きする
    setLineStyles(prevLineStyles => ({
      // スプレッド構文。元のlineStylesオブジェクトを新しいオブジェクトにコピー
      // これにより、更新対象外の罫線の色やスタイルが消えてしまうことを防ぐ
      ...prevLineStyles,
      // 選択されている罫線のスタイルを更新する部分
      // 算出プロパティ構文(角括弧内に変数を使ってオブジェクトのキーを動的に作成する)
      // これにより、元のlineStylesオブジェクトのうち対象の罫線だけ新しいオブジェクトで上書きする
      [selectedLineKey]: {
        ...prevLineStyles[selectedLineKey], // スプレッド構文で対象の罫線のオブジェクトを新しいオブジェクトにコピー
        style: selectedLineStyle // 対象罫線のスタイルを選択された罫線のスタイルに変更
      }
    }));
  };

  // 罫線の色が変更されたときのイベントハンドラー
  const changeTargetLineColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedLineColor = e.target.value;
    setLineStyles(prevLineStyles => ({
      ...prevLineStyles,
      [selectedLineKey]: {
        ...prevLineStyles[selectedLineKey],
        color: selectedLineColor
      }
    }));
  };

  // 最後にフォーカスされた罫線入力要素のDOM参照を保持するステート(初期値はnull)
  const [lastActiveLineInput, setLastActiveLineInput] = useState<ContentEditableElement>(null);

  // 選択した文字のフォントを変更する共通関数
  const changeFontStyle = (command: string, value: string | undefined) => {
    if (!lastActiveLineInput) {
      alert("スタイルを変更したい文字を選択してください。");
      return;
    }

    try {
      lastActiveLineInput.focus();

      // 書式変更をHTMLタグではなくCSSスタイルで適用するよう、execCommand()の動作モードを切り替える
      document.execCommand("styleWithCSS", false, 'true');
      document.execCommand(command, false, value);
    } catch (e) {
      console.error("execCommand failed:", e);
    }
  };

  // 選択した文字の色を変更する処理
  const changeTargetTextColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    changeFontStyle("foreColor", newColor);
  };

  // 選択した文字を太字に変更する処理
  const changeTargetTextToBold = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    changeFontStyle("bold", undefined);
  };

  // 選択した文字をイタリックに変更する処理
  const changeTargetTextToItalic = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    changeFontStyle("italic", undefined);
  };

  // 選択した文字に下線を追加する処理
  const addTargetTextToUnderline = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    changeFontStyle("underline", undefined);
  };

  const X_SCALE_STEP = 1; // 罫線入力フォームのx軸に対する拡大・縮小率のステップ数
  const MIN_X_SCALE = 0; // 罫線入力フォームのx軸に対する拡大・縮小率の最小値
  const MAX_X_SCALE = 100; // 罫線入力フォームのx軸に対する拡大・縮小率の最大値

  // セレクトボックスで現在選択されている罫線入力フォーム(初期値はlineInput1)
  const [selectedLineInputKey, setSelectedLineInputKey] = useState('lineInput1');

  // 各罫線入力フォームのx軸に対する拡大・縮小率
  const [lineInputXScales, setLineInputXScales] = useState<Record<string, number>>({
    lineInput1: 100,
    lineInput2: 100,
    lineInput3: 100,
    lineInput4: 100,
    lineInput5: 100,
    lineInput6: 100,
    lineInput7: 100,
    lineInput8: 100,
    lineInput9: 100,
  });

  // 罫線入力フォームのx軸に対する拡大・縮小率を取得する関数
  const getXScaleStyle = (lineInputKey: string) => {
    const scale = lineInputXScales[lineInputKey];
    return {transform: `scaleX(${scale / 100})`};
  };

  // 対象の罫線入力フォームのx軸に対する拡大・縮小率が変更された時のイベントハンドラー
  const changeTargetLineInputXScale = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scale = Number(e.target.value);
    if (!(MIN_X_SCALE <= scale && scale <= MAX_X_SCALE)) {
      alert(`罫線の幅の倍率は${MIN_X_SCALE} 〜 ${MAX_X_SCALE}%の間で指定してください。`);
      return;
    }
    setLineInputXScales(prevLineInputXScales => ({
      ...prevLineInputXScales,
      [selectedLineInputKey]: scale
    }));
  };

  // 複数の<div contentEditable="true"></div>要素への参照をまとめて保管する箱
  // useRefは値が変わっても再レンダリングされない。DOM要素を直接保持できる。
  // lineInputRefs.currentに値が入る
  // イメージとしてはlineInputRefs.current = {'lineInput1' => HTMLDivElement, 'lineInput2' => HTMLDivElement}となる
  // 初回レンダリング時はDOM要素がなくdiv要素に記載しているref={(el) => {...}}のelにはnullが渡ってくるので、nullも許可しておく
  // 括弧内に記載している空オブジェクトが初期値となる
  const lineInputRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 初回レンダリング時、及び第2引数の依存配列内の変数の値が変わった時に実行される
  // 正確には値が変わってレンダリングされ、DOMが更新されてから呼ばれる
  useEffect(() => {
    const lineInputEl = lineInputRefs.current[selectedLineInputKey];
    if (lineInputEl) {
      lineInputEl.focus();

      // 以下、カーソルを入力されている文字の末尾に移動させる処理
      // <div contentEditable="true"></div>要素の中身(値)全てを範囲選択する
      const range = document.createRange();
      range.selectNodeContents(lineInputEl);
      // 範囲選択を潰す。falseで範囲選択の「一番最後」にカーソルを置く
      // ここまではrangeオブジェクトの中身が変わっただけで、実際の画面には反映されない
      range.collapse(false);

      // 今ユーザーが画面でどこを選択しているか、実カーソル・実テキスト選択状態を取得
      const sel = window.getSelection();
      // 古い選択が残っていると不具合となるので、既に選択されているものを消し何も選択されていない状態にする
      sel?.removeAllRanges();
      // 上記で作成した「一番最後」にカーソルを置いた状態を実際の選択状態として適用
      sel?.addRange(range);
    }
  }, [selectedLineInputKey]);

  // ワークシート上の全ての文字を削除
  const clearAllTexts = () => {
    if (!confirm("ワークシート上の文字をすべて削除します。よろしいですか？")) return;
    // タイトルをクリア
    setTitle('');
    // 罫線入力フォーム上の文字をクリア
    const worksheet = document.getElementById('worksheet');
    worksheet?.querySelectorAll<HTMLElement>('[contenteditable="true"]')
      .forEach((lineInputEl) => {
        lineInputEl.innerHTML = '';
      });
    // 1行目にフォーカスを戻す
    lineInputRefs.current['lineInput1']?.focus();
  };

  // ワークシートをPDFでダウンロード
  const downloadWorksheetAsPdf = () => {
      const worksheetElement = document.getElementById("worksheet") as HTMLElement;
      // DOM要素をcanvas要素に変換
      html2canvas(worksheetElement).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const jsPdf = new jsPDF();
        // PDFの高さと横幅を取得
        const width = jsPdf.internal.pageSize.getWidth();
        const height = jsPdf.internal.pageSize.getHeight();
        // 引数：画像データ、画像形式、左上頂点のx軸、左上頂点のy軸、追加する画像の幅、追加する画像の高さ
        jsPdf.addImage(imgData, 'PNG', 0, 0, width, height);
        jsPdf.save("英語ワークシート.pdf");
      })
  };

  return (
    // JSXでは1つの要素を返す必要がある為、全体を1つの要素で囲う必要がある
    // しかしdivタグ等で囲うと無駄にネストすることになる為react fragmentを使う
    <>
      <div className={`sidebar ${isSidebarClosed ? 'closed' : ''}`}>

        <div className="sidebar-inner">
          <h4>ワークシートのタイトル</h4>
          <input
            onChange={(e) => setTitle(e.target.value)}
            value={title}
            type="text"
            className="form-control"
            placeholder="例）Today's weather"
          />

          <hr />

          <h4 className="mt-4">文字のスタイル</h4>
          <div className="d-flex align-items-center gap-2">
            <div className="input-group w-auto">
              <input
                onChange={changeTargetTextColor}
                type="color"
                className="form-control form-control-color"
              />
              <span className="input-group-text">色</span>
            </div>
            <div className="btn-group" role="group" aria-label="文字のスタイル">
              <button
                onClick={changeTargetTextToBold}
                className="btn btn-primary fw-bold"
                title="太字"
              >
                B
              </button>
              <button
                onClick={changeTargetTextToItalic}
                className="btn btn-primary fst-italic"
                title="イタリック"
              >
                I
              </button>
              <button
                onClick={addTargetTextToUnderline}
                className="btn btn-primary text-decoration-underline"
                title="下線"
              >
                U
              </button>
            </div>
          </div>

          <hr />

          <h4 className="mt-4">罫線のスタイル</h4>
          <div className="input-group mb-4">
            <span className="input-group-text">第</span>
            <select
              value={selectedLineKey}
              onChange={(e) => setSelectedLineKey(e.target.value)}
              className="form-select"
            >
              {lineIndexes.map((lineIndex) => (
                <option key={lineIndex} value={`line${lineIndex}`}>{lineIndex}</option>
              ))}
            </select>
            <span className="input-group-text">罫線</span>
          </div>
          <div className="input-group">
            <select
              // 現在選択されている罫線のスタイルを設定
              // 対象の罫線が変更されると自動的に変更された罫線の現在のスタイルに切り替える
              value={lineStyles[selectedLineKey].style}
              onChange={changeTargetLineStyle}
              className="form-select"
            >
              <option value="solid">直</option>
              <option value="dotted">点</option>
              <option value="dashed">ダッシュ</option>
            </select>
            <span className="input-group-text">線</span>
            <input
              type="color"
              // 現在選択されている罫線の色を設定
              // 対象の罫線が変更されると自動的に変更された罫線の現在の色に切り替える
              value={lineStyles[selectedLineKey].color}
              onChange={changeTargetLineColor}
              className="form-control form-control-color"
            />
            <span className="input-group-text">色</span>
          </div>

          <hr />

          <h4 className="mt-4">罫線の幅</h4>
          <div className="input-group mb-4">
            <select
              value={selectedLineInputKey}
              onChange={(e) => setSelectedLineInputKey(e.target.value)}
              className="form-select"
            >
            {lineGroupIndexes.map((lineGroupIndex) => (
              <option key={lineGroupIndex} value={`lineInput${lineGroupIndex}`}>{lineGroupIndex}</option>
            ))}
            </select>
            <span className="input-group-text">行目</span>
            <input
              type="number"
              className="form-control"
              onChange={changeTargetLineInputXScale}
              value={lineInputXScales[selectedLineInputKey]}
              min={MIN_X_SCALE}
              max={MAX_X_SCALE}
              step={X_SCALE_STEP}
            />
            <span className="input-group-text">%</span>
          </div>
          <input
            type="range"
            className="w-100"
            onChange={changeTargetLineInputXScale}
            value={lineInputXScales[selectedLineInputKey]}
            min={MIN_X_SCALE}
            max={MAX_X_SCALE}
            step={X_SCALE_STEP}
          />

          <hr />

          <h4 className="mt-4">その他の操作</h4>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={downloadWorksheetAsPdf}
              className="btn btn-primary w-50"
            >
              <i className="fa-regular fa-file-pdf"></i>
              PDF出力
            </button>
            <button
              onClick={clearAllTexts}
              className="btn btn-danger w-50"
            >
              <i className="fa-solid fa-trash-can"></i>
              クリア
            </button>
          </div>
        </div>
      </div>

      {/* ワークシート */}
      <div className="main-content">
        <nav className="header navbar">
          <div className="container-fluid">
            <a
              onClick={() => setIsSidebarClosed(!isSidebarClosed)}
              className="navbar-brand text-white"
            >
              <i className="fa-solid fa-bars"></i>
            </a>
          </div>
        </nav>
        <div className="worksheet-container">
          <div id="worksheet" className="worksheet">
            <div className="worksheet-header">
              <div className="student-info">
                <div className="student-info-box">
                  <div className="student-info-label">Grade</div>
                  {/*
                    input要素だとhtml2canvasでキャプチャした際に入力文字が上に配置され、
                    切れてしまう不具合があるためcontentEditableを使用
                    参考：https://github.com/niklasvh/html2canvas/issues/2008
                  */}
                  <div className="student-info-input" contentEditable="true"></div>
                </div>
                <div className="student-info-box">
                  <div className="student-info-label">Class</div>
                  <div className="student-info-input" contentEditable="true"></div>
                </div>
                <div className="student-info-box">
                  <div className="student-info-label">No.</div>
                  <div className="student-info-input" contentEditable="true"></div>
                </div>
              </div>

              <div className="line-group student-name">
                {lineIndexes.map((lineIndex) => (
                  <div
                    key={lineIndex}
                    className={`line line${lineIndex}`}
                    style={getBorderTopStyle(`line${lineIndex}`)}
                  >
                  </div>
                ))}
                <div className="student-name-label">
                  <span>Name</span><span>Date<span className="date"> ・・</span></span>
                </div>
                <div
                  // DOMレンダリング時にlineInputRefs.currentの中に指定したキー(lineInput1)でこのdiv要素自体を保存
                  // 初回レンダリング時はDOM要素がなくelにはnullが渡ってくる
                  ref={(el) => {lineInputRefs.current['lineInput1'] = el}}
                  className="line-input"
                  contentEditable="true"
                  style={getXScaleStyle('lineInput1')}
                  onFocus={(e) => setLastActiveLineInput(e.currentTarget)} // フォーカスが当たった時(マウスを使わずTabキーで移動した時を考慮)
                  onKeyUp={(e) => setLastActiveLineInput(e.currentTarget)} // キー入力があった時(キーボード操作によるテキスト入力・矢印キーでの文字の選択範囲の変更を考慮)
                  onClick={(e) => setLastActiveLineInput(e.currentTarget)} // マウスでクリックされた時
                >
                </div>
              </div>
            </div>

            <div className="worksheet-title">{title}</div>
            <div id="line-groups">
              {lineGroupIndexes.map((lineGroupIndex) => (
                // 他のアイテムと区別できるよう配列内で一意のkeyが必要
                <div key={lineGroupIndex} className="line-group">
                  {lineIndexes.map((lineIndex) => (
                    <div
                      key={lineIndex}
                      className={`line line${lineIndex}`}
                      style={getBorderTopStyle(`line${lineIndex}`)}
                    >
                    </div>
                  ))}
                  <div
                    ref={(el) => {lineInputRefs.current[`lineInput${lineGroupIndex + 1}`] = el}}
                    className="line-input"
                    contentEditable="true"
                    style={getXScaleStyle(`lineInput${lineGroupIndex + 1}`)}
                    // onChangeは以下理由により使用できないので、ブラウザのネイティブイベントを使う
                    // 1.フォーム要素(<input>, <textarea>, <select>)で、その要素の「値 (value)」が変化したときに発生するため
                    // 2.「値が変更された」ことしか教えてくれず、フォーカスの移動等は補足できないため
                    onFocus={(e) => setLastActiveLineInput(e.currentTarget)} // フォーカスが当たった時(マウスを使わずTabキーで移動した時を考慮)
                    onKeyUp={(e) => setLastActiveLineInput(e.currentTarget)} // キー入力があった時(キーボード操作によるテキスト入力・矢印キーでの文字の選択範囲の変更を考慮)
                    onClick={(e) => setLastActiveLineInput(e.currentTarget)} // マウスでクリックされた時
                  >
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
