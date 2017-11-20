import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, LoadingController  } from 'ionic-angular';
import { User } from "../../models/user";
import { AngularFireDatabase } from 'angularfire2/database';
// import { Observable } from 'rxjs/Observable';
// import { AngularFireAuth } from 'angularfire2/auth';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import firebase from 'firebase';
import { Http } from '@angular/http';
import { RegisterPage} from '../register/register';
import { SuperadminPage } from '../superadmin/superadmin';
import { SenderPage } from '../sender/sender';

/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  registerpage = RegisterPage;
  superadminpage = SuperadminPage;
  senderpage = SenderPage;
  scannedCode = null;

  loading:any;
  public user = {} as User;
  public users: any;
  public validatestate;
  public checkstate;
  public permission;

  constructor(
    // private afAuth: AngularFireAuth,
    public http : Http,
    public afd: AngularFireDatabase,
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController ,
    public navParams: NavParams,
    public firebaseProvider: FirebaseProvider,
    ) {
  }

  async Login(user: User) {
    if(this.validateUser(user)){
      var that = this;
      var query = firebase.database().ref("users").orderByKey();

      that.checkstate = true;
      query.once("value").then(function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            if(that.checkstate){
              if (childSnapshot.val().email == user.email){
                if (childSnapshot.val().password == user.password){
                  that.checkstate = false;
                  that.permission = childSnapshot.val().permission;
                  that.user.id = childSnapshot.val().id;
                  that.user.avatar = childSnapshot.val().avatar;
                  that.user.fullName = childSnapshot.val().fullName;
                  that.user.password = childSnapshot.val().password;
                  that.user.email = childSnapshot.val().email;
                  that.user.birthday = childSnapshot.val().birthday;
                  that.user.gender = childSnapshot.val().gender;
                  that.user.role = childSnapshot.val().role;
                  that.user.paypalEmail = childSnapshot.val().paypalEmail;
                  that.user.paypalPassword = childSnapshot.val().paypalPassword;
                  that.user.paypalVerifyState = childSnapshot.val().paypalVerifyState;
                  that.user.groupId = childSnapshot.val().groupId;
                  that.goLogin(user);
                }else{
                  that.showAlert("Password is incorrect!");
                  that.checkstate = false;
                }
              }
            }
            console.log(that.checkstate);
          });
          if(that.checkstate){
            var text = "Username or email are incorrect!";
            that.showAlert(text);
          }
      });
    }
  }

  validateUser(user){
    this.validatestate = true;
    var text =  'Checking...';
    this.showLoading(text);
    if (!user.email){
      this.showAlert("Please enter your email");
      this.validatestate = false;
    }else{
      if (!user.password || user.password.length<6){
        this.showAlert("Password length must be at least 6 letter.");
        this.validatestate = false;
      }
    }
    this.loading.dismiss();
    return this.validatestate;

  }
  goLogin(user){
      if(user.role == 3){
      this.navCtrl.push(SuperadminPage, {
        user: user
      });
    }else {
      this.navCtrl.push(SenderPage, {
        user:user
      });
    }
  }
  goRegister(){
    this.navCtrl.push(RegisterPage, {
  });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }
  showLoading(text) {
    this.loading = this.loadingCtrl.create({
      content: text,
      dismissOnPageChange: true,
      showBackdrop: false
    });
    this.loading.present();
  }

  showAlert(text) {
      let alert = this.alertCtrl.create({
        title: 'Warning!',
        subTitle: text,
        buttons: [{
          text: "OK",
        }]
      });
      alert.present();
  }
}
