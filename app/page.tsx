//「このファイルおよび、ここからインポートされる全てのモジュールは
// クライアントサイドで実行されるコンポーネントである」と宣言するためのディレクティブ
// ユーザーの操作に応じて状態が変わるようなインタラクティブなUIを実装するには、
// ブラウザ(クライアントサイド)でJavaScriptを実行する必要があるため
// Client Componentであることを明示的に指定する
'use client'

import { useState } from "react";

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

  // 罫線のスタイルオブジェクト内の値の型を宣言
  type LineStyle = {
    color: string;
    style: string;
  };

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

  return (
    // JSXでは1つの要素を返す必要がある為、全体を1つの要素で囲う必要がある
    // しかしdivタグ等で囲うと無駄にネストすることになる為react fragmentを使う
    <>
      <div className={`sidebar ${isSidebarClosed ? 'closed' : ''}`}>

        <div className="sidebar-inner">
          <h4>ワークシートのタイトル</h4>
          <input onChange={(e) => setTitle(e.target.value)} type="text" className="form-control" placeholder="例）Today's weather" />

          <hr />

          <h4 className="mt-4">文字のスタイル</h4>
          <div className="d-flex align-items-center gap-2">
            <div className="input-group w-auto">
              <input type="color" id="textColor" className="form-control form-control-color" />
              <span className="input-group-text">色</span>
            </div>
            <div className="btn-group" role="group" aria-label="文字のスタイル">
              <button id="btnBold" className="btn btn-primary fw-bold" title="太字">
                B
              </button>
              <button id="btnItalic" className="btn btn-primary fst-italic" title="イタリック">
                I
              </button>
              <button id="btnUnderline" className="btn btn-primary text-decoration-underline" title="下線">
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

          <h4 className="mt-4">行の幅</h4>
          <div className="input-group mb-4">
            <select id="targetLineInput" className="form-select"></select>
            <span className="input-group-text">行目</span>
            <input id="lineInputScaleValue" type="number" className="form-control" value="100" min="0" max="100" step="1" />
            <span className="input-group-text">%</span>
          </div>
          <input id="lineInputScaleRange" type="range" className="w-100" value="100" min="0" max="100" step="1" />

          <hr />

          <h4 className="mt-4">その他の操作</h4>
          <div className="d-flex align-items-center gap-2">
            <button id="downloadPdfBtn" className="btn btn-primary w-50">
              <i className="fa-regular fa-file-pdf"></i>
              PDF出力
            </button>
            <button id="clearBtn" className="btn btn-danger w-50">
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
                <div className="line-input" contentEditable="true"></div>
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
                  <div className="line-input" contentEditable="true"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
