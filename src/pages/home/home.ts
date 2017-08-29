import { Component, ViewChild, NgZone } from '@angular/core';
import { Content } from 'ionic-angular';
import { NavController,LoadingController } from 'ionic-angular';
import { Conversa } from '../../model/Conversa';
import { ConversasionService } from '../../providers/conversation';
import { Platform, ToastController } from 'ionic-angular';


import { TextToSpeech } from '@ionic-native/text-to-speech';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { Observable } from 'rxjs/Observable';
import { ChangeDetectorRef } from '@angular/core';

/**
 * @author Bruno Freire
 * 
 * Classe utilizada para realizar o processo de comunicação com a API da 
 * IBM - Watson, recuperando os dados filtrados do BI e exibindo em forma
 * de graficos para o usuario
 */

//Variaveis usadas para saber em qual plataforma a APP esta sendo executada.;
declare var platform: any;
declare var window: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [ConversasionService]
})
export class HomePage {
  //VARIAVEIS USADAS PARA A GRAVAÇÃO DOS AUDIOS E CONVERSÃO PARA TEXTO.
  recognition: any;
  continuarScrol = 0;
  idScroll = 0;
  ready: boolean = false;
  isWaiting: boolean = false;
  errorCordova: string = "No error";
  public statusSpeaker: string;
  public resultText: string;
  public isRecognizing: boolean = false;
  public spokenWords: Array<string> = new Array<string>()
  counter: number = 0;
  loader: any;

  isRecording = false;
  ////////////////////fim

  @ViewChild(Content) cont: Content;

 

  id: any = 0;
  element: any;
  context: any;
  mediaRec: any;
  texto: string;
  conversa: string[] = new Array<string>();
  conversaObj: Conversa = new Conversa;
  conversaObjOpcoes: Conversa = new Conversa;
  listaConversa: Conversa[] = new Array<Conversa>();
  complemento: string;
  exibirSpinner: boolean = false;




  /**
   * Construtor da classe de comunicação e processamento dos graficos
   */
  constructor(public navCtrl: NavController, public loadCtrl: LoadingController, private conversasionService: ConversasionService,
    platform: Platform, public _zone: NgZone, public toastCtrl: ToastController,private tts: TextToSpeech,
    private speechRecognition: SpeechRecognition, private plt: Platform, private cd: ChangeDetectorRef) {

      this.exibirSpinner = false;
    // FAZ A PRIMEIRA INTERAÇÃO COM A API DA IBM
    this.conversasionService.enviar("Start", "").subscribe(data => {
      this.conversaObj.id=false;
      this.conversaObj.possibilidades = <Array<string>> data.context.possibilidades;
      this.conversaObj.texto = data.output.text;
      this.tts.speak({locale: 'pt-BR', rate: 1, text: data.output.text})
      this.listaConversa.push(this.conversaObj);
      this.conversaObj = new Conversa;
      this.conversa.push(data.output.text);
      // ESTE CONTEXTO DEVE SEMPRE SER ATUALIZADO A CADA INTERAÇÃO. ELE É O RESPONSAVEL PELA CONTINUAÇÃO DA CONVERSA.
      this.context = data.context;
      /////////////////////////////////


      //ESTE MOTODO É O RESPONSAVEL PELA FUNÇÃO DE GRAVAR O AUDIO ---------------------------
      platform = platform;
      platform.ready().then(() => {
        this.ready = true;
        console.log("Recognition is " + this.recognition)
        if (window.SpeechRecognition) {

          this.recognition = new window.SpeechRecognition();
          //this.recognition.start();

          this.recognition.continuous = true;
          this.recognition.lang = 'br-PT';
          this.recognition.maxAlternatives = 3;
          
          this.recognition.onnomatch = (event => {
            console.log('Não foi possivel a compreensão.');
          });

          this.recognition.onstart = (event => {
            console.log('Iniciada a gravação.');

            this.presentToast("Iniciada a Gravação")
            this.element.classList.add('icone-microfone');
            this._zone.run(() => {
              this.isRecognizing = true;
              this.isWaiting = false;
            }
            )
          });

          // METODO ONEND  Resposavel pela finalinalização da gravação
          this.recognition.onend = (event => {
            console.log('Finalizada a gravação.');
            this.element.classList.remove('icone-microfone');
            this._zone.run(() => {
              this.isRecognizing = false;
              this.isWaiting = false;
            })
          });

          //QUANDO NÃO FOI POSSIVEL COMPREENDER OQUE FOI FALADO.
          this.recognition.onerror = (event => {
            console.log('Não encontrado');
            this._zone.run(() => {
              this.errorCordova = 'Error'
              this.isRecognizing = false;
              this.presentToast('Não foi possivel entender')
              this.isWaiting = false;
            }
            )
          });

          //RESULTADO DA GRAVAÇÃO
          this.recognition.onresult = (event => {
            if (event.results) {
              this._zone.run(() => {
                var result = event.results[0];
                this.resultText = 'Você disse: \n' + result[0].transcript;
                this.texto = result[0].transcript;
                //METODO RESPONSAVEL PELA INTERAÇÃO COM A IBM
                this.enviar();
                ////////////////////
                this.spokenWords.push(result[0].transcript);
                console.log('Text: ' + result[0].transcript);
                this.presentToast(this.resultText)
              }
              )
              this.isWaiting = false;
              this.isRecognizing = false;
            }
          });

        }
      });
    });
  }

  // CHAMADO QUANDO É PARA REFAZER A TELA E INICIAR UMA NOVA CONVERSA.
  iniciar() {
    this.navCtrl.setRoot(HomePage);

  }


  enviar() {
    if(this.texto){
    this.abrirLoading();
    this.exibirSpinner = true;
    this.conversaObj.id = true;
    this.conversaObj.texto = this.texto;
    this.listaConversa.push(this.conversaObj);

    this.conversaObj = new Conversa;
   this.cont.scrollToBottom()
    this.conversasionService.enviar(this.texto, this.context).subscribe(data => {
      this.tts.speak({locale: 'pt-BR', rate: 1, text: data.output.text})
      console.log(data)
        this.conversa.push(data.output.text);
        this.conversaObj.possibilidades = <Array<string>> data.context.possibilidades;
  
        this.conversaObj.id = false;
        this.idScroll = this.idScroll + 1;
        this.conversaObj.idScroll = this.idScroll;
        this.conversaObj.texto = data.output.text;
        this.listaConversa.push(this.conversaObj);
           this.conversaObj = new Conversa;
        
      
    }, error => {
      // ESTE ERRO ACONTECE QUANDO É FEITA VARIAS INTERAÇÕES EM POUCO TEMPO. POIS ESTAVAMOS USANDO A VERSÃO TESTE DA IBM.
      this.showToastWithCloseButton("Demo application rate limit reached for your IP Address. This is NOT the real service API, just a proxy for an API explorer. Rate limit is 6 per minute. It will reset in 6 seconds.")

    },
      () => {
        this.fecharLoading();
        this.texto = '';
        this.exibirSpinner = false;
        
      })
      }
  }


scrollTo(element) {
   
       //let posicaoElemento = this.getPosition(elemento);
       console.log("===========================")
       console.log(this.continuarScrol)
   
        this.continuarScrol = this.continuarScrol +100000;
        this.exibirSpinner = false;
        this.cont.scrollTo(0, this.continuarScrol, 3000).then(data => {
          this.fecharLoading();
        })

   
  }

   esperarCarregarPage(idScroll) {
    let elemento = document.getElementById(idScroll);
    if (elemento) {
      this.scrollTo(idScroll)
    } else {
        setTimeout(() => this.esperarCarregarPage(idScroll), 1000);
    }
  }

  getPosition(element) {

      var yPosition = 0;

      while (yPosition == 0) {
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
      }
      return yPosition;
    }

  //O TEMPO QUE O TOAST IRA PERMANECER NA TELA  -----------------------------------
  presentToast(message) {
    let toast = this.toastCtrl.create({
      message: message,
      position: "middle",
      duration: 3000
    });
    toast.present();
  }

  //USADO QUANDO ACONTECER O ERRO PELO FATO DE USAR A VERSÃO TESTE
  showToastWithCloseButton(message) {
    const toast = this.toastCtrl.create({
      message: message,
      showCloseButton: true,
      closeButtonText: 'Ok'
    });
    toast.present();
  }


  //QUANDO É PRESSIONADO O BOTÃO DO MICROFONE É CHAMADO ESTE METODO.
  SpeechToText() {
    this.statusSpeaker = 'Aguardando...';
    if (!this.isRecognizing) {
      //INICIA A GRAVAÇÃO
      this.recognition.start();
      this.isWaiting = true;
    }
    else {
      this.isWaiting = true;
    }
  }

  ionViewDidLoad() {
    this.element = document.getElementById('microfone');
  }



   public abrirLoading() {
    this.loader = this.loadCtrl.create({
      content: "Aguarde ... "
    });
    this.loader.present();
    //this.events.publish('PROCESSANDO_FIM');
  }

  /**
  * Metodo utilizado para fechar o sincronizando
  */
  public fecharLoading() {
    this.loader.dismiss();
     setTimeout(() => this.cont.scrollToBottom(), 1000);
  }

  
  isIos() {
    return this.plt.is('ios');
  }
 
  stopListening() {
    this.speechRecognition.stopListening().then(() => {
      this.isRecording = false;
    });
  }
 
  getPermission() {
    this.speechRecognition.hasPermission()
      .then((hasPermission: boolean) => {
        if (!hasPermission) {
          this.speechRecognition.requestPermission();
        }
      });
  }
 
  startListening() {
     this.speechRecognition.hasPermission()
      .then((hasPermission: boolean) => {
        if (!hasPermission) {
          this.speechRecognition.requestPermission();
        }else{
          let options = {
              language: 'pt-BR'
            }
            this.speechRecognition.startListening().subscribe(matches => {
              this.texto = matches[0];
              this.enviar();
              this.cd.detectChanges();
            });
            this.isRecording = true;
        }
      });
    
  }
}
