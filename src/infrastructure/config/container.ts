import { UserService } from '@/application/services/UserService';
import { AuthService } from '@/application/services/AuthService';
import { MongoUserRepository } from '@/infrastructure/database/mongodb/MongoUserRepository';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { UserController } from '@/interfaces/controllers/UserController';
import { UserPresenter } from '@/interfaces/presenters/UserPresenter';
import { HealthController } from '@/interfaces/controllers/HealthController';

export interface Container {
  // Repositories
  userRepository: UserRepository;
  
  // Services
  authService: AuthService;
  userService: UserService;
  
  // Presenters
  userPresenter: UserPresenter;
  
  // Controllers
  userController: UserController;
  healthController: HealthController;
}

export class DIContainer {
  private static instance: DIContainer;
  private container: Container;

  private constructor() {
    this.container = this.createContainer();
  }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private createContainer(): Container {
    // Infrastructure Layer - Repositories
    const userRepository = new MongoUserRepository();

    // Application Layer - Services
    const authService = new AuthService();
    const userService = new UserService(userRepository, authService);

    // Interface Layer - Presenters
    const userPresenter = new UserPresenter();

    // Interface Layer - Controllers
    const userController = new UserController(userService, userPresenter);
    const healthController = new HealthController();

    return {
      userRepository,
      authService,
      userService,
      userPresenter,
      userController,
      healthController
    };
  }

  public getContainer(): Container {
    return this.container;
  }

  public getUserService(): UserService {
    return this.container.userService;
  }

  public getUserController(): UserController {
    return this.container.userController;
  }

  public getHealthController(): HealthController {
    return this.container.healthController;
  }

  // Method to reset container (useful for testing)
  public resetContainer(): void {
    this.container = this.createContainer();
  }
}

// Export singleton instance
export const container = DIContainer.getInstance();