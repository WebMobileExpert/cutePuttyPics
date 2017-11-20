import { NgZone,Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ToastController  } from 'ionic-angular';
import { User } from '../../models/user';
import { AngularFireDatabase } from 'angularfire2/database';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import firebase from 'firebase';
import { Http } from '@angular/http';

import { ActionSheetController, Platform, LoadingController, Loading } from 'ionic-angular';

import { Camera } from '@ionic-native/camera';


declare var cordova: any;

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})

export class SettingsPage {

  public olduserData= {} as User;
  public newuserData= {} as User;
  loading: Loading;
  public imgsources: any;
  public captureDataUrl : string;
  firestore = firebase.storage();
  public storageDirectory : string;
  public toastText:string;
  public user:any;
  public transactions:any;
  public transaction = {
    avatar:[],
    name:[],
    date:[],
    amount:[],
  };
  public transactiontotalmoney:number;
  constructor(
    public zone: NgZone,
    private camera: Camera,
    public actionSheetCtrl: ActionSheetController,
    public platform: Platform,
    public loadingCtrl: LoadingController,
    public http : Http,
    public afd: AngularFireDatabase,
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    public navParams: NavParams,
    public toastCtrl: ToastController,
    public firebaseProvider: FirebaseProvider,) {
      this.olduserData = navParams.get("user");
      this.http = http;
      this.platform.ready().then(() => {
        if(!this.platform.is('cordova')) {
            return false;
        }

        if (this.platform.is('ios')) {
            this.storageDirectory = cordova.file.dataDirectory;
        }
        else if(this.platform.is('android')) {
            this.storageDirectory = cordova.file.externalApplicationStorageDirectory;
        }
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');
    console.log(this.olduserData.avatar);
    var that = this;
    that.transactiontotalmoney = 0;
    var query = firebase.database().ref("transactions").orderByKey();
    query.once("value").then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          if(that.olduserData.role == 1){
            if (childSnapshot.val().senderid == that.olduserData.id && childSnapshot.val().transactionstate == 1) {
              that.transactiontotalmoney += Number(childSnapshot.val().sendmoney);
              console.log(childSnapshot.val().transactionid);
              console.log('sender');
            }
          }else if(that.olduserData.role == 0){
            if (childSnapshot.val().receiverid == that.olduserData.id && childSnapshot.val().transactionstate == 1) {
              that.transactiontotalmoney += Number(childSnapshot.val().sendmoney);
              console.log(childSnapshot.val().transactionid);
            }
          }else{

          }

        });
    });
  }
  updateUser(newuserData){
    if(newuserData.fullName){
      if(newuserData.password){
        if(newuserData.email){
          if(newuserData.birthday){
            if(newuserData.gender){
              if(newuserData.paypalEmail){
                if(newuserData.paypalPassword){
                  var that= this;
                  var ref = firebase.database().ref().child('/users');
                  var refUserId = ref.orderByChild('id').equalTo(this.olduserData.id);
                  refUserId.once('value', function(snapshot) {
                    if (snapshot.hasChildren()) {
                        snapshot.forEach(
                          function(snap){
                            console.log(snap.val());
                            snap.ref.update({
                              "fullName": newuserData.fullName,
                              "email": newuserData.email,
                              "password": newuserData.password,
                              "gender":newuserData.gender,
                              "avatar":newuserData.avatar,
                              "birthday":newuserData.birthday,
                              "paypalEmail":newuserData.paypalEmail,
                              "paypalPassword":newuserData.paypalPassword
                            });
                            that.presentToast("Your profile updated successfully!");
                            return true;
                          });
                    } else {
                      console.log('wrong');
                    }
                  });
                } else {
                  this.showAlert("Please enter your paypal password");
                }
              }else{
                this.showAlert("Please enter your paypal email");
              }
            }else{
              this.showAlert("Please enter your gender");
            }
          }else{
            this.showAlert("Please enter your birthday");
          }
        }else{
          this.showAlert("Please enter your email");
        }
      }else{
        this.showAlert("Please enter your password");
      }
    }else{
      this.showAlert("Please enter your fullname");
    }

  }
  showAlert(toastText) {
      let message = toastText;
      let alert = this.alertCtrl.create({
        title: 'Warning!',
        subTitle: "'" +message +"'",
        buttons: [{
          text: "OK",
        }]
      });
      alert.present();
  }
  presentToast(text) {
    const toast = this.toastCtrl.create({
      message: text,
      duration: 3000,
      position: 'top'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }
  public presentActionSheet() {

    let actionSheet = this.actionSheetCtrl.create({
        title: 'Select Image Source',
        buttons: [
        {
            text: 'Load from Library',
            handler: () => {
                this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);

            }
        },
        {
            text: 'Use Camera',
            handler: () => {
                this.takePicture(this.camera.PictureSourceType.CAMERA);
            }
        },
        {
            text: 'Cancel',
            role: 'cancel'
        }]
    });
    actionSheet.present();
}

public takePicture(sourceType) {

    var options = {
        quality: 100,
        sourceType: sourceType,
        saveToPhotoAlbum: false,
        correctOrientation: true,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
    };

    this.camera.getPicture(options).then((imagePath) => {
        this.captureDataUrl = 'data:image/jpeg;base64,' + imagePath;
        this.uploadImage();
    }, (err) => {
      this.presentToast('Selecting image canceled.');
    });
}

public uploadImage() {

  if(this.captureDataUrl != undefined){

      let storageRef = firebase.storage().ref();
      var filename = Math.floor(Date.now() / 1000);

      const imageRef = storageRef.child(`images/${filename}.jpg`);

      this.loading = this.loadingCtrl.create({
          content: 'Uploading...',
      });
      this.loading.present();

      imageRef.putString(this.captureDataUrl, firebase.storage.StringFormat.DATA_URL).then((snapshot)=> {

          this.loading.dismissAll()
          this.presentToast('Upload Success!');
          this.firestore.ref().child(`images/${filename}.jpg`).getDownloadURL().then((url) => {
            this.olduserData.avatar = url;
        })

      }, (err) => {
          this.loading.dismissAll();
          this.presentToast('Upload Failed!');
      });
    }
    else{
        this.showAlert('Please select an image.');
    }
  }

}
