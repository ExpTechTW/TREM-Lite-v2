<template>
  <div class="setting-wrapper">
    <div class="setting-container">
      <div class="setting-header">
        <div class="setting-title">
          <div class="back_to_home_wrapper">
            <div class="btn back_to_home">
              <div class="report-detail-field-icon material-symbols-rounded">
                arrow_back_ios
              </div>
            </div>
            <p>返回</p>
          </div>
          <span>設定</span>
          <button class="setting-reset-btn">重設</button>
        </div>
      </div>
    </div>
  </div>
  <div class="usr-account-info-wrapper">
    <div class="usr-account-info-container">
      <div class="usr-account-info-content show-account-info">
        <div class="account">尚未登入</div>
        <div class="vip"></div>
        <div class="login-btn">登入</div>
        <div class="logout-btn">登出</div>
      </div>
      <div class="login-forms-content">
        <div class="login-back">
          <div class="report-detail-field-icon material-symbols-rounded">
            arrow_back_ios
          </div>
          <span>返回</span>
        </div>
        <div class="login-form-input">
          <input type="text" placeholder="信箱" />
          <input type="password" placeholder="密碼" />
          <span class="login_msg error"></span>
          <div class="login-btn">登入</div>
          <a target="_blank" href="https://exptech.com.tw/forgot">
            <span>忘記密碼？</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
