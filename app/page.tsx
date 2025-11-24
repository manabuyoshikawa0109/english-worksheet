import React from "react";

export default function EnglishWorksheet() {
  return (
    // JSXでは1つの要素を返す必要がある為、全体を1つの要素で囲う必要がある
    // しかしdivタグ等で囲うと無駄にネストすることになる為react fragmentを使う
    <>
      <div id="sidebar" className="sidebar">

        <div className="sidebar-inner">
          <h4>ワークシートのタイトル</h4>
          <input id="worksheetTitleInput" type="text" className="form-control" placeholder="例）Today's weather" />

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
            <select id="targetLine" className="form-select">
              <option value="line1">1</option>
              <option value="line2">2</option>
              <option value="line3">3</option>
              <option value="line4">4</option>
            </select>
            <span className="input-group-text">罫線</span>
          </div>
          <div className="input-group">
            <select id="lineStyle" className="form-select">
              <option value="solid">直</option>
              <option value="dotted">点</option>
              <option value="dashed">ダッシュ</option>
            </select>
            <span className="input-group-text">線</span>
            <input id="lineColor" type="color" className="form-control form-control-color" />
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
            <a id="toggleSidebar" className="navbar-brand text-white">
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
                <div className="line line1"></div>
                <div className="line line2"></div>
                <div className="line line3"></div>
                <div className="line line4"></div>
                <div className="student-name-label">
                  <span>Name</span><span>Date<span className="date"> ・・</span></span>
                </div>
                <div className="line-input" contentEditable="true"></div>
              </div>
            </div>

            <div id="worksheetTitle" className="worksheet-title"></div>
            <div id="line-groups"></div>
          </div>
        </div>
      </div>
    </>
  );
}
