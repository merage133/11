; Inno Setup Script для RU AI Studio
; Версия скрипта: 1.0.0
; Требования: Inno Setup 6.x или выше

#define MyAppName "RU AI Studio"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "RU AI Studio Team"
#define MyAppURL "https://github.com/ru-ai-studio"
#define MyAppExeName "start.bat"

[Setup]
; Основные настройки
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Пути установки
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; Лицензия
LicenseFile=LICENSE.txt

; Вывод
OutputDir=installer_output
OutputBaseFilename=RU_AI_Studio_Setup_{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern

; Архитектура
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

; Привилегии
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

; Языки интерфейса
ShowLanguageDialog=yes

; Отмена установки
UninstallDisplayIcon={app}\{#MyAppExeName}

; Оформление (раскомментируйте и укажите пути к картинкам)
; WizardImageFile=compiler:WizModernImage.bmp
; WizardSmallImageFile=compiler:WizModernSmallImage.bmp
; Для кастомных картинок:
; WizardImageFile=images\wizard_image.bmp
; WizardSmallImageFile=images\wizard_small.bmp

; Версия установщика
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Setup
VersionInfoTextVersion={#MyAppVersion}

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked onlybelowversion(6.1;10.0)

[Files]
; Основные файлы приложения
Source: "dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "server.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "installer.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "start.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "INSTALL.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "USAGE.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "package.json"; DestDir: "{app}"; Flags: ignoreversion

; Примечание: никогда не используйте "Flags: ignoreversion" для файлов, которые могут обновляться

[Icons]
; Ярлык в меню Пуск
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"

; Ярлык на рабочем столе (опционально)
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

; Ярлык в Quick Launch (для старых Windows)
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: quicklaunchicon

[Run]
; Запуск программы после установки (опционально)
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

; Проверка Node.js после установки
Filename: "cmd.exe"; Parameters: "/c node --version"; Flags: runhidden waituntilterminated; StatusMsg: "Проверка Node.js..."

; Проверка Ollama после установки
Filename: "cmd.exe"; Parameters: "/c ollama --version"; Flags: runhidden waituntilterminated; StatusMsg: "Проверка Ollama..."

[UninstallDelete]
; Удаление временных файлов при деинсталляции
Type: filesandordirs; Name: "{app}\dist"
Type: filesandordirs; Name: "{app}\node_modules"

[Code]
// Проверка Node.js при установке
function IsNodeInstalled(): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/c node --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

// Проверка Ollama при установке
function IsOllamaInstalled(): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/c ollama --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

// Функция проверки перед установкой
function InitializeSetup(): Boolean;
var
  ErrorCode: Integer;
  MsgText: String;
begin
  Result := True;
  
  // Проверка Node.js
  if not IsNodeInstalled() then
  begin
    MsgText := 'Node.js не обнаружен на вашем компьютере.' + #13#10 + #13#10 +
               'Для работы RU AI Studio необходимо установить Node.js.' + #13#10 + #13#10 +
               'Скачать Node.js: https://nodejs.org/' + #13#10 + #13#10 +
               'Продолжить установку?';
    
    if MsgBox(MsgText, mbConfirmation, MB_YESNO) = IDNO then
    begin
      Result := False;
      Exit;
    end;
  end;
  
  // Проверка Ollama
  if not IsOllamaInstalled() then
  begin
    MsgText := 'Ollama не обнаружена на вашем компьютере.' + #13#10 + #13#10 +
               'Для работы RU AI Studio необходимо установить Ollama.' + #13#10 + #13#10 +
               'Скачать Ollama: https://ollama.com/download' + #13#10 + #13#10 +
               'Продолжить установку?';
    
    if MsgBox(MsgText, mbConfirmation, MB_YESNO) = IDNO then
    begin
      Result := False;
      Exit;
    end;
  end;
end;

// Функция после установки
procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
  MsgText: String;
begin
  if CurStep = ssPostInstall then
  begin
    // Предложение установить модель
    MsgText := 'Установка завершена!' + #13#10 + #13#10 +
               'Хотите установить модель qwen2.5:7b сейчас?' + #13#10 + #13#10 +
               'Размер: ~4.7 GB' + #13#10 +
               'Это займёт несколько минут.' + #13#10 + #13#10 +
               'Вы можете установить модель позже командой:' + #13#10 +
               'ollama pull qwen2.5:7b';
    
    if MsgBox(MsgText, mbConfirmation, MB_YESNO) = IDYES then
    begin
      Exec('cmd.exe', '/c ollama pull qwen2.5:7b', '', SW_SHOW, ewWaitUntilTerminated, ResultCode);
    end;
  end;
end;

// Создание ярлыка на рабочем столе после установки (если выбрана задача)
procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpFinished then
  begin
    // Можно добавить дополнительную логику здесь
  end;
end;
