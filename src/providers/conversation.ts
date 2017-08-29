import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import {Observable} from 'rxjs/Observable';


@Injectable()
export class ConversasionService {

  headers: Headers;

  constructor(public http: Http) {
  }


  

  public post(url, data: any) {
            this.headers.append('Content-Type', 'application/x-www-form-urlencoded');
            return this.http.post(url, data, { headers: this.headers});

    }

  public handleError(error: Response) {
    console.error("Erro no servidor:" + error);
    return Observable.throw('Não foi possível estabelecer uma conexão com o servidor.');
  }


  public enviar(texto: string , context: any){
    this.headers =  new Headers({ 'Content-Type': 'application/json' });
    let cod = btoa("7b80151f-ff64-4b33-a4b0-614a2116565f:IWU5vhfJJ18Z");

    this.headers.append('Authorization' , 'Basic '+cod);
      let response;
      let jsonObject;
        var url = 'https://watson-api-explorer.mybluemix.net/conversation/api/v1/workspaces/a954e6e9-c5bb-4971-b73a-773bc830bdc0/message?version=2017-05-26';
      if(context == ""){
        jsonObject = {
          text:texto
        }
      }else{
        console.log(texto);
         jsonObject = {
           "input": {
                text:texto
            },

          context:context
        }
      }
      let bodyString = JSON.stringify(jsonObject);
      try {
          response = this.http.post(url, bodyString, { headers: this.headers })
          .map(res => res.json())
          .catch(this.handleError);
          return response;
      } catch (e) {
          return Observable.throw(e);
      }
  }

 get(url) {
          this.headers =  new Headers({ 'Content-Type': 'application/json' });
           return this.http.get(url, { headers: this.headers });
   }

}
