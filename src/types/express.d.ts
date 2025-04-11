// Type definitions for express
declare module 'express' {
  namespace express {
    interface Request {
      query: any;
      body: any;
    }
    
    interface Response {
      sendFile(path: string): void;
      json(data: any): void;
      status(code: number): Response;
    }
    
    interface Application {
      use(middleware: any): void;
      get(path: string, handler: (req: Request, res: Response) => void): void;
      post(path: string, handler: (req: Request, res: Response) => void): void;
      listen(port: number, callback: () => void): any;
    }
  }
  
  function express(): express.Application;
  export = express;
}
