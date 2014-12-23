"use strict";

O.RunLoop.invoke(function(){
	var email = {};

	email.source = new O.RPCSource({
		url: '/Email'
	});

	email.store = new O.Store({
		source:email.source,
		autocommit: false
	});

	email.undoManager = new O.StoreUndoManager({
		store: email.store,
		maxUndoCount: 10
	});

	var emailInput = new O.Class({
		Extends: O.Record,

		_id: O.Record.attr(String, {
			isPrimaryKey: true,
			key: 'id'
		}),

		isComplete: O.Record.attr(Boolean, {
			isNullable: false,
			defaultValue: false
		}),

		value: O.Record.attr(String,{
			isNullable: false,
			defaultValue: ''
		}),

		autoCommitIsComplete: function() {
			if (!(this.get('status') & O.Status.NEW)) {
				email.store.commitChanges();
			}
		}.observes('isComplete')
	});

    email.source.handle(emailInput, {
        fetch: 'getEmail',
        commit: 'setEmail',
        email: function(args) {
            this.didFetchAll(email, args);
        },

        emailSet: function(args) {
            this.didCommit(email, args);
        }
    });

	email.state = new O.Router({

		editEmail:null,
		
		commitChanges: function(_, __, oldEmail) {
			if (oldEmail !== null) {
				app.store.commitChanges();
			}
		}.observes('editEmail'),

		title: 'Wizard - EStable',

		baseUrl:'Wizard/StepOne'
	});

	email.currentEmail = new O.SingleSelectionController({
		content: O.bind(email.state, 'email')
	});

	email.actions = {
		newEmail: function(){
			var newEmail = new emailInput(email.store);

			newEmail.saveToStore();

			email.store.refreshLiveQueries();
			email.currentEmail.set('record', newEmail);
			email.state.set('editEmail', newEmail);
		}
	};

	email.views = {
		mainWindow: new O.RootView(document, {
			selectNone: function(event){
				if (!(event.targetView instanceof O.ButtonView)) {
					email.state.set('editEmail', null);
					email.currentEmail.set('record', null);
				}
			}.on('click')
		})
	}

	var emailView = O.Class({
		Extends: O.TextView
	});

	var appView = new O.View({
		className: 'v-App',
		
		childViews: [
			new O.LabelView({
				positioning: 'absolute',
				className: 'v-app-title',
				value: 'Email'
			}),

			new O.View({
				className: 'v-app-email',
				draw: function(){
					return [
						new O.ListView({
							content: O.bind(email.state, 'email'),
							renderInOrder: false,
							ItemView: emailView,
							itemHieght: 50
						})
					];
				}
			})
		],
		newEmail: function(target){
			if(event.targetView ===this){
				email.actions.newEmail();
			}
		}.on('dblclick')
	});

	email.views.mainWindow.insertView(appView);
})