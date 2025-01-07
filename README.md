# Kokomi Shopping

これは、Kokomi Shopping（という架空のショッピングアプリ）を想定して作成した、TypeScriptサーバーです。

基本的な買い物アプリの実装は行われており、エンドポイントのテストも行われています。

ただし、CloudinaryやStripeはモックを利用しているため、果たして本当に機能するかは神のみぞ知ります。

## 使用しているサービス

- 認証：Firebase Authentication

- データベース：Firestore

- 決済処理：Stripe

- 画像保存：Cloudinary

## できること！

- ユーザーの作成・更新・削除

- 製品の作成・取得・更新・削除

- ユーザーのカートに製品を入れたり、取り出したりする

- Stripeで決済処理を行う

- Cloudinaryに製品画像を保存する

- 管理者・モデレーター専用のルートがあり、これらの特権ユーザーの管理を行う

## 画像の処理

画像の処理は、とっても面倒でした・・・

例として、製品画像のサムネイルが保存されるまでの流れを示します。

1. `/products/upload-thumbnail`へ要求を送る
  リクエストの本文は`Content-Type: multipart/form-data`形式、`thumbnail`という名前で、リクエストを送信します。

  HTMLとJSで表すとこのようになります。

  ```html
  <input type="file" name="thumbnail">
  <img src="" alt="製品のサムネイル">
  <script>
    const input = document.querySelector('input[name="thumbnail"]');
    const img = document.querySelector('img');

    form.addEventListener("change", (event) => {
      const files = event.currentTarget.files;

      if (files.length !== 0) {
        return;
      }

      const form_data = new FormData();

      const thumbnail = files[0];

      form_data.append("thumbnail", thumbnail);

      fetch("/products/upload-thumbnail", {
        method: "POST",
        body: form_data
      })
      .then(res => res.json())
      .then(data => img.src = data.thumbnail);
    });
  </script>
  ```

2. 一時的に利用するディレクトリに保存される

  送信された画像は、Cloudinaryの`temp`ディレクトリに保存され、その一時的に利用可能な画像のURLが送信されます。
  
  ```js
  {
    thumbnail: "画像のURL",
    success: true
  }
  ```

3. イベントの発火

  Cloudinaryに無事に画像が保存されると、`upload-completed`イベントが発火し、サーバー上にある`temp`ディレクトリ
