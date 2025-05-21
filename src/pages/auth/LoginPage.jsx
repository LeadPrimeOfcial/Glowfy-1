
    import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    import { Eye, EyeOff, LogIn } from 'lucide-react';
	import authService from '@/services/authService';

    const LoginPage = () => {
      const navigate = useNavigate();
      const { toast } = useToast();
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [isLoading, setIsLoading] = useState(false);

      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);

        try {
      // Chama o serviço de login
      const responseData = await authService.login(email, password);
      
      // O serviço authService.login já armazena o token e usuário no localStorage
      // se o login for bem-sucedido e a API retornar um token.

      toast({
        title: 'Login bem-sucedido!',
        description: `Bem-vindo(a) de volta, ${responseData.user?.nome || 'Admin'}!`, // Usa o nome do usuário da API
      });
      navigate('/admin/dashboard'); // Redireciona para o dashboard

    } catch (error) {
      // O apiClient já deve ter lançado um objeto de erro com a mensagem da API
      let errorMessage = 'Email ou senha inválidos. Por favor, tente novamente.';
      if (error && error.message) {
        errorMessage = error.message; // Usa a mensagem de erro da API
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Erro de login',
        description: errorMessage,
        variant: 'destructive',
      });
      // Limpar o token se o login falhar (caso exista um antigo inválido)
      authService.logout(); 
    } finally {
      setIsLoading(false);
    }
  };

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-glowfy-primary/10 via-glowfy-secondary/10 to-glowfy-accent/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full max-w-md shadow-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-glowfy-primary to-glowfy-accent"></div>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Bem-vindo(a) ao GLOWFY</CardTitle>
                <CardDescription className="text-glowfy-muted-foreground">Faça login para gerenciar seu negócio</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-glowfy-background border-glowfy-border focus:border-glowfy-primary"
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-glowfy-background border-glowfy-border focus:border-glowfy-primary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-7 h-7 w-7 text-glowfy-muted-foreground hover:text-glowfy-primary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                   <Button type="submit" className="w-full bg-glowfy-primary hover:bg-glowfy-primary/90 text-glowfy-primary-foreground text-lg py-3 flex items-center justify-center" disabled={isLoading}>
                     {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-5 w-5 border-2 border-transparent border-t-glowfy-primary-foreground rounded-full"
                        />
                     ) : (
                       <>
                         <LogIn className="mr-2 h-5 w-5" /> Entrar
                       </>
                     )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
  <p className="text-xs text-glowfy-muted-foreground">
    Esqueceu sua senha? <a href="#" className="text-glowfy-primary hover:underline">Recuperar senha</a>
  </p>

  <div className="w-full mt-6 text-center">
    <p className="text-sm text-glowfy-muted-foreground">
      &copy; {new Date().getFullYear()} GLOWFY. Todos os direitos reservados.
    </p>
    <p className="text-xs text-glowfy-muted-foreground mt-1">
      Desenvolvido por <a href="https://www.leadprime.com.br" target="_blank" rel="noopener noreferrer" className="text-glowfy-primary hover:underline">
    LeadPrime Softwares
  </a>.
    </p>
  </div>
</CardFooter>

            </Card>
          </motion.div>
        </div>
      );
    };

    export default LoginPage;
  