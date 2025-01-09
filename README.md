# Kokomi Shopping

これは、Kokomi Shopping（という架空のショッピングアプリ）を想定して作成した、TypeScript サーバーです。

基本的な買い物アプリの実装は行われており、エンドポイントのテストも行われています。

ただし、Cloudinary や Stripe はモックしているため、果たして本当に機能するかは神のみぞ知ります。

## 使用しているサービス

- 認証：Firebase Authentication

- データベース：Firestore

- 決済処理：Stripe

- 画像保存：Cloudinary

## できること！

- ユーザーの作成・取得・更新・削除

- 製品の作成・取得・更新・削除

- 製品のレビューの作成・取得・更新・削除

- ユーザーのカートに製品を入れたり、取り出したりする

- Stripe で決済処理を行う

- Cloudinary に製品画像を保存する

- 管理者・モデレーター専用のルートがあり、これらの特権ユーザーの管理を行う

## 準備

1. 依存関係のインストール

   ```bash
   npm i
   ```

2. Firebase のサービスアカウントキーをこのプロジェクトのルートに配置する。

   `serviceAccountKey.json`ファイルをルートに配置します。

   ```json
   {
   	"type": "service_account",
   	"project_id": "",
   	"private_key_id": "",
   	"private_key": "",
   	"client_email": "",
   	"client_id": "",
   	"auth_uri": "",
   	"token_uri": "",
   	"auth_provider_x509_cert_url": "",
   	"client_x509_cert_url": "",
   	"universe_domain": ""
   }
   ```

3. 環境変数をセットする

   Cloudinary や Stripe の API キーを配置します。`.env.example`を参考に環境変数をセットしてください。Redis に関しては、使わないようであれば、`src/server.ts`を編集して、Redis に関連したコードを削除してください。

4. 準備完了！

   `npm run serve`を行うとサーバーが起動します。プロジェクトは fly.io でデプロイしやすいようになっています。お好きなように、`fly.toml`ファイルを編集してください。

## 画像の処理

製品画像のサムネイルが保存されるまでの流れを示します。

1. **リクエストを送る**

   リクエストの本文は`Content-Type: multipart/form-data`形式、`thumbnail`という名前で、`/products/リクエストを送信します。

   フロントエンドではこのようにしたらいいでしょう。

   ```html
   <input type="file" />
   <img src="" alt="製品のサムネイル" />
   <script>
   	const input = document.querySelector("input");
   	const img = document.querySelector("img");

   	input.addEventListener("change", (event) => {
   		const files = event.currentTarget.files;

   		if (files.length !== 0) {
   			return;
   		}

   		const form_data = new FormData();

   		const thumbnail = files[0];

   		form_data.append("thumbnail", thumbnail);

   		fetch("/products/upload-thumbnail", {
   			method: "POST",
   			body: form_data,
   		})
   			.then((res) => res.json())
   			.then((result) => (img.src = result.data.image_url));
   	});
   </script>
   ```

2. **一時的に利用するディレクトリに保存される**

   送信された画像は、Cloudinary の`temp`ディレクトリに保存され、`temporary`というタグが付けられます。このタグの付与されたデータは Cloudinary の管理画面から定期的に削除できるよう設定できます。

   画像を送信すると、以下のデータが返ってきます。

   ```js
   {
     success: true,
     data: {
       public_id: "temp/<画像の一時的なpublic_id>",
       image_url: "一時的にアクセス可能なCloudinaryのsecure_url"
     }
   }
   ```

   後述する『製品の登録と同時に画像』のステップでは、このときに返された`public_id`を`thumbnail`プロパティの値として送信してください。

3. **イベントの発火**

   Cloudinary に無事に画像が保存されると、`upload-completed`イベントが発火し、サーバー上の`temp`ディレクトリ内にあるその画像が削除されます。

4. **製品の登録と画像の永続化**

   ユーザーが製品情報を入力し終わり、送信ボタンをクリックしたら、`/products`に**POST**リクエストを送ります。

   先ほども書いた通り、`thumbnail`や`images`の値は、`public_id`を使用してください。

   これにより、Cloudinary の方で、`temp`ディレクトリから、`products/:product_id`ディレクトリに画像が移動し、永続化されます。

5. **完了！**

   `images`の処理は同様な感じで`/products/upload-image`へリクエストを送ります。後述するように、このエンドポイントは複数の画像データを送れるようになっています。

## 認証について

ユーザー認証は、Firebase Authentication の Web SDK を利用してください。

ユーザーが認証されていることを必要とする API ルートには、この認証の際に生成される`idToken`を Bearer トークンとして送ってください。

フロントエンドではこのような実装が必要となります。`auth`は Firebase Authentication を初期化したものになります。詳しくは、Firebase のドキュメントを見てください。

```js
let id_token;

onAuthStateChanged(auth, (user) => {
	if (user) {
		id_token = user.getIdToken();
	} else {
		id_token = "";
	}
});

fetch("/users", {
	method: "POST",
	headers: {
		Authorization: "Bearder " + id_token,
	},
	body: JSON.stringify({
		//　登録するユーザーの情報
	}),
})
	.then((res) => res.json())
	.then((result) => result.data);
```

## API 一覧

権限は、以下の絵文字で表現しています。

- 🌐：誰でもアクセスできるルート

- 🔒：ユーザー認証が必要なルート

- 🛒：売り手ユーザー専用のルート

- 🛍️：買い手ユーザー専用のルート

- 👑：管理者専用ルート

- 🛡️：管理者とモデレーター

### 一般に公開されるルート

管理者は全ての操作ができますが、モデレーターユーザーは`GET`リクエストのみアクセスでき、リソースは変更できません。

| エンドポイント                       | メソッド | 権限 | 説明                                                                                                      |
| ------------------------------------ | -------- | ---- | --------------------------------------------------------------------------------------------------------- | --- |
| `/users`                             | `POST`   | 🔒   | ユーザーの登録を行います。管理者およびモデレーターの登録は別です。                                        |
| `/users/:user_id`                    | `GET`    | 🌐   | ユーザー情報を取得できます。一般のユーザー取得できるのは自分自身または売り手ユーザーのみです。            |
| `/users/:user_id`                    | `PATCH`  | 🔒   | ユーザーを更新します。                                                                                    |
| `/users/:user_id`                    | `DELETE` | 🔒   | ユーザーを削除します。                                                                                    |
| `/users/:user_id/cart`               | `GET`    | 🛍️   | ユーザーのカートを取得します。 カートはユーザーの作成と同時に作られます。                                 |
| `/users/:user_id/cart/add`           | `PATCH`  | 🛍️   | ユーザーのカートに製品を追加します。                                                                      |
| `/users/:user_id/cart/subtract`      | `PATCH`  | 🛍️   | ユーザーのカートから製品の個数を減らします。減らした結果として 0 になった場合は、その製品は削除されます。 |
| `/users/:user_id/cart`               | `DELETE` | 🛍️   | ユーザーのカートから全ての製品が消えます。                                                                |
| `/users/:user_id/reviews`            | `GET`    | 🌐   | あるユーザーの製品のリストを取得します。                                                                  |
| `/users/:user_id/reviews`            | `POST`   | 🛍️   | あるユーザーのレビューを作成します。                                                                      |
| `/users/:user_id/reviews/:review_id` | `PATCH`  | 🛍️   | あるユーザーのレビューを更新します。                                                                      |
| `/users/:user_id/reviews/:review_id` | `DELETE` | 🛍️   | あるユーザーのレビューを削除します。                                                                      |
| `/users/:user_id/orders`             | `GET`    | 🔒   | 自身の注文履歴を全て取得します。                                                                          |
| `/users/:user_id/orders/:order_id`   | `GET`    | 🔒   | 特定の注文履歴を取得します。                                                                              |
| `/users/:user_id/orders/:order_id`   | `PATCH`  | 🛒   | 特定の注文のステータスを変更します。買い手の注文履歴も同時に更新されます。                                |
| `/procuts`                           | `GET`    | 🌐   | 製品を取得します。                                                                                        |
| `/products`                          | `POST`   | 🛒   | 製品を作成します。                                                                                        |
| `/products/:product_id`              | `GET`    | 🌐   | 製品を取得します。                                                                                        |
| `/products/:product_id`              | `PATCH`  | 🛒   | 製品を更新します。                                                                                        |
| `/products/:product_id`              | `DELETE` | 🛒   | 製品を削除します。                                                                                        |
| `/products/upload-thumb`             | `POST`   | 🛒   | 一時保存された製品のサムネイル画像のデータを取得します。単一の画像データを受け取ります。                  |
| `/products/upload-images`            | `POST`   | 🛒   | 一時保存された製品画像の情報のリストを取得します。 複数の画像データの配列を受け取ります。                 |
| `/reviews`                           | `GET`    | 🌐   | クエリパラメーターを使って、様々なレビューを取得できます。                                                |
| `/payment`                           | `POST`   | 🛍️   | 配送先の住所と支払いの成功・失敗時のリダイレクト先を本文に添付してください。                              |
| `/webhook`                           | `POST`   | 🌐   | Stripe での支払いに成功した場合のリダイレクト先です。                                                     |
| `/health`                            | `GET`    | 🌐   | サーバーの稼働状況を確かめます。                                                                          |     |

### ユーザーの権限を管理するルート

以下で紹介するルート（`/priviledged`）は、管理者とモデレーターのみがアクセスできます。
管理者およびモデレーターは、一般ユーザーとは異なる、`priviledged_users`コレクションに保存されます。

- **管理者の作成**

  1. **メールアドレスを設定する**

     初めの管理者は`.env`ファイルの`FIRST_USER_EMAIL`の値で登録できます。

     ```text
     FIRST_USER_EMAIL=<管理者のメールアドレス>
     ```

  2. **管理者ユーザーでログインする**

     Firebase Authentication でフロントエンドからログインします。初めの管理者の登録には、メールアドレスを使用するため、Github とかでメールアドレスを隠したままであったりした場合はこれを行えません。ログイン時にはメールアドレスが取得できる認証方法を採用してください。2 人目以降の管理登録からはこれを気にする必要はありません。

  3. **管理者ユーザーのユーザー ID を取得する**

     管理者とするユーザーの ID を取得します。ログインした状態で、`/priviledged/user-id`へ GET リクエストを送信してください。これにより、ログイン状態にあるユーザーの`uid`が返されます。

  4. **管理者を作成する**

     管理者とするユーザーを作成します。例として、以下のようなフロントエンドのコードになります。

     ```js
     const admin = {
     	id: "<先ほど取得したユーザーID>",
     	name: "空条承太郎",
     	email: "jotaro@jojo.com",
     	access_rights: "admin",
     };

     fetch("/priviledged/users", {
     	method: "POST",
     	headers: {
     		Authorization: "Bearer " + admin_id_token,
     	},
     	body: JSON.stringify(admin),
     }).then(() => console.log("管理者の登録が完了しました！"));
     ```

- **モデレーターの作成**

  モデレーターの登録は**管理者権限を持つユーザーのみ**が行えます。モデレーターを登録する手順は以下のようになります。

  1. **モデレーターとなるユーザーの認証**

     フロントエンドの方でユーザー登録を行います。

  2. **モデレーターとなるユーザーの ID を確認する**

     Bearer トークンを付与したリクエストを、`/priviledged/user-id`へ送ると、`uid`をそのユーザーの`uid`の値を取得できます。

  3. **モデレーターを作成する**

     ```js
     const moderator = {
     	id: "<先ほど取得したユーザーID>",
     	name: "ジョルノ・ジョバーナ",
     	email: "test1@example.com",
     	access_rights: "moderator",
     };

     fetch("/priviledged/users", {
     	method: "POST",
     	headers: {
     		Authorization: "Bearer " + admin_id_token,
     	},
     	body: JSON.stringify(moderator),
     }).then(() => console.log("管理者の登録が完了しました！"));
     ```

- **API ルートの一覧**

| エンドポイント               | メソッド | 権限 | 説明                                                     |
| ---------------------------- | -------- | ---- | -------------------------------------------------------- |
| `/priviledged/user-id`       | `GET`    | 🛡️   | 管理者またはモデレーターとするユーザーの ID を取得する。 |
| `/privileged/users`          | `GET`    | 👑   | 管理者・モデレーターの一覧を取得する。                   |
| `/privileged/users`          | `POST`   | 👑   | 管理者・モデレーターを作成する。                         |
| `/privileged/users/:user_id` | `GET`    | 🛡️   | モデレーターの場合は、自身のデータだけを取得できる。     |
| `/privileged/users/:user_id` | `PATCH`  | 👑   | 管理者・モデレーターのデータを変更する。                 |
| `/privileged/users/:user_id` | `DELETE` | 👑   | 管理者・モデレーターを削除する。                         |

### クエリパラメーター

`/reviews`や`/products`ルートではクエリパラメーターでデータを制限して取得できます。

### 不等号

不等号を利用する際には、`operator:param=value`の形にしてください。

| オペレーター | 意味         |
| ------------ | ------------ |
| `gt`         | ～より大きい |
| `gte`        | ～以上       |
| `lt`         | ～未満       |
| `lte`        | ～以下       |

例えば、1000 円から 2000 円までの製品を取得する場合にはこのようにクエリパラメーターを書きます。

```text
/products?gte:price=1000&gte:price=2000
```

### 並び替えや制限

並び替えは、`?order=asc`、`?order=desc`のように書きます。取得するリストの数を制限するには、`?limit=20`のように、書くことができます。デフォルトの最大取得数は、**30**です。これを変更するには、`src/const.ts`にある、を編集してください。

## データ型

エンドポイントがボディで受け取るデータの形式と例をまとめました。

形式は、画像は`multipart/form-data`、それ以外は `JSON` になります。

最低文字数はとりあえず 5 文字です。メールアドレスなども検証されます。`created_at`や`updated_at`フィールドは自動で作成・更新されます。`timestamp`型のデータは、ISO8601 形式の日付になって返されます。

`created_by`フィールドは更新できません。

- **一般ユーザー**

  `addresses`プロパティ内には 4 つまでの住所が登録可能です。

  - 作成に必要なデータ

    ```ts
    {
    	name: string;
    	email: string;
    	role: string;
    	addresses: {
    		recipient_name: string;
    		zip_code: string;
    		address: {
    			address1: string;
    			address2: string;
    			address3: string;
    		}
    	}
    	[];
    }
    ```

  - 保存されるデータ

    ```ts
    {
    	id: string;
    	name: string;
    	email: string;
    	role: string;
    	addresses: {
    		recipient_name: string;
    		zip_code: string;
    		address: {
    			address1: string;
    			address2: string;
    			address3: string;
    		}
    	}
    	[];
    	created_at: Timestamp;
    	updated_at: Timestamp;
    }
    ```

- **カート**

  - `add`と`subtract`のルートが受け入れるデータ

    `quantity`は常に正の数であるようにしてください。

    ```ts
    {
    	product_id: string;
    	quantity: number;
    }
    ```

  - 取得されるカート

    ```ts
    [
      {
        product: {
          id: string
          product_id: string;
          title: string;
          description: string;
          created_by: string;
          created_at: string; // ISO8601形式の日付
          updated_at: string; // ISO8601形式の日付
        },
        quantity: number
      }
    ]
    ```

- **レビュー**

  `title`は 5 文字以上、`description`は 10 文字以上が要件です。

  - 作成に必要なデータ

    ```ts
    {
    	product_id: string;
    	title: string;
    	description: string;
    }
    ```

  - 保存されるデータ

    ```ts
    {
    	id: string;
    	product_id: string;
    	title: string;
    	description: string;
    	created_by: string;
    	created_at: Timestamp;
    	updated_at: Timestamp;
    }
    ```

- **注文履歴**

  ステータスのみ変更可能です。

  売り手はステータスを`delivered`に変更することはできますが、`shipped`に変更することはできません。一方、買い手はステータスを`shipped`に変更することはできますが、`delivered`に変更することはできません。

  要するに、メルカリのような形式で、商品の発送・受取は各々で手動で処理するようにしてくださいということです。

  宅配業者が公開している API を使えばいいのでは？と思われるかもしれませんが、審査を受けなければそうしたサービスは提供してくれないとのことです。

  ```ts
  {
  	status: "shipped" | "delivered";
  }
  ```

- **製品画像**

  画像は、"png"、"jpg"、"webp"の 3 種類を受け取れるようにしています。

  サムネイル画像は 1 枚のみ、他の製品画像は 5 枚まで対応しています。

  - サムネイル

    ```ts
    input.addEventListener("change", (event) => {
    	const files = event.currentTarget.files;

    	if (files.length !== 0) {
    		return;
    	}

    	const form_data = new FormData();

    	const thumbnail = files[0];

    	form_data.append("thumbnail", thumbnail);

    	fetch("/products/upload-thumb", {
    		method: "POST",
    		body: form_data,
    	})
    		.then((res) => res.json())
    		.then(console.log);
    });
    ```

    ```ts
    {
      success: true,
      data: {
        public_id: string;
        image_url: string;
      }
    }
    ```

  - 他の製品画像

    ```ts
    input.addEventListener("change", (event) => {
    	const files = event.currentTarget.files;

    	if (files.length !== 0) {
    		return;
    	}

    	const form_data = new FormData();

    	form_data.append("images", files);

    	fetch("/products/upload-images", {
    		method: "POST",
    		body: form_data,
    	})
    		.then((res) => res.json())
    		.then(console.log);
    });
    ```

    ```ts
    {
      success: true,
      data: {
        public_id: string;
        image_url: string;
      }[]
    }
    ```

- **製品**

  `short_description`は 50 文字以内、`long_description`は 10 文字以上かつ 2000 文字以内にしてください。

  - 作成に必要なデータ

    ```ts
    {
    	name: string,
    	thumbnail: string,
    	images: string[],
    	short_description: string,
    	long_description: string,
    	price: number,
    	category: string,
    	stock: number,
    };
    ```

  - 保存されるデータ

    ```ts
    {
    	id: string,
    	name: string,
    	thumbnail: string,
    	images: string[],
    	short_description: string,
    	long_description: string,
    	price: number,
    	category: string,
    	stock: number,
    	created_by: string,
    	created_at: Timestamp,
    	updated_at: Timestamp,
    };
    ```

- 支払い

  Stripe の支払いページへリダイレクトさせるには、`/payment`に以下のデータを本文にしたリクエストを送る必要があります。

  ```ts
  {
  	shipping_address: {
  		address1: string;
  		address2: string;
  		address3: string;
  	}
  	success_url: string;
  	cancel_url: string;
  }
  ```

## 注意事項

- ユーザーが製品を削除しても、カートの中身はそのままになります。このため、カート取得時には、存在する製品のみを含む配列が渡されることになります。この不要なデータが削除するには、ユーザーが製品を購入する操作を行うか、手動でカートをリセットする必要があります。ユーザーが製品を削除したらそれを持つユーザーのカートをすべてを更新する・・・想像するだけで恐ろしい、データベースに不整合が発生するに決まっています。

- 現在の仕様では、レビューや製品の`created_by`フィールドはそのリソースを作成したユーザーの ID が返されるだけなため、使いづらいかもしれません。これらの取得時に、ユーザー ID からユーザー名も取得して送信するのが良いかもしれません。ただしこの場合、Firestore へかなり負担をかけるので、悩ましいところです。製品を登録する際にユーザー ID とユーザー名を一緒に保存するのも手ですが、この場合はユーザーが名前を変更する際にそれに関連するすべてのドキュメントを更新しなくてはいけないため苦労します。そのため、フロントエンドでは、商品一覧のページで、"販売元を見る"といったリンクを表示させるのが良い手でしょうか。

- カート内にある商品が在庫切れかどうかは、カート内の製品データの、`quantity`と`product.stock`の差で確認する必要があります。

- ユーザーは削除することができますが、そのユーザーが書いたレビューは削除されません。

## 製品の整合性について

ユーザーが Stripe で支払いを行ったにも関わらず、既にその製品が他の誰かに買われているような事態は避けたいところです。これの対策として、ユーザーは、`/payment`に POST リクエストを送った際に、カート内の商品から`unpaid`をステータスとする注文を生成するようにしています。3 時間ごとに 1 度の Cron ジョブで、3 時間以内に購入が行われなかった注文は自動的に元に戻され、削除されるようになっています。

## 保存されるデータ

データは以下のようにデータベースに保存されます。

| データの種類             | 参照                                 |
| ------------------------ | ------------------------------------ |
| 一般ユーザー             | `/users/:user_id`                    |
| カート                   | `/users/:user_id/cart`               |
| カート内の製品           | `/users/:user_id/cart/:product_id`   |
| レビュー                 | `/users/:user_id/reviews/:review_id` |
| オーダー                 | `/users/:user_id/orders/:order_id`   |
| 製品                     | `/products/:product_id`              |
| 権限の付与されたユーザー | `/priviledged-users/:user_id`        |

画像は以下のように、Cloudinary に保存されます。`temp`フォルダに保存される画像には、`temporary`タグが付与されます。

| データの種類               | フォルダ               |
| -------------------------- | ---------------------- |
| 一時的にアクセス可能な画像 | `temp`                 |
| 製品の画像                 | `products/:product_id` |

## Licence

MIT